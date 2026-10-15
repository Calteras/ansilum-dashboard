import i18n from '@/i18n'
import { API_BASE_URL } from '@/config/api.config'
import { notifyAuthSessionExpired } from '@/lib/auth-session'
import { getActiveTenantId } from '@/lib/tenant-api-client'

/** Multipart file field names differ per endpoint — see the image upload API contract. */
type ImageField = 'photo' | 'image' | 'logo'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(',')

function copy(id: string, en: string) {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? 'id'
  return lang.startsWith('id') ? id : en
}

const isAuthPath = (path: string) => path.startsWith('/auth/')

/**
 * Instant client-side feedback only — the server is the authority and
 * re-validates by decoding the image. An empty MIME type is let through
 * because the server accepts valid images sent as application/octet-stream.
 */
export function validateImageFile(file: File): string | null {
  if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return copy(
      'Pilih gambar JPG, PNG, atau WebP.',
      'Please choose a JPEG, PNG or WebP image.'
    )
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return copy(
      'Ukuran gambar melebihi 10 MB. Pilih gambar yang lebih kecil.',
      'That image is larger than 10 MB. Please choose a smaller one.'
    )
  }
  return null
}

function fallbackMessage(status: number) {
  switch (status) {
    case 413:
      return copy(
        'Ukuran gambar melebihi 10 MB. Pilih gambar yang lebih kecil.',
        'That image is larger than 10 MB. Please choose a smaller one.'
      )
    case 400:
      return copy(
        'Pilih gambar JPG, PNG, atau WebP di bawah 10 MB.',
        'Please choose a JPEG, PNG or WebP under 10 MB.'
      )
    case 401:
      return copy(
        'Sesi Anda berakhir. Silakan masuk kembali.',
        'Your session expired. Please sign in again.'
      )
    case 403:
      return copy(
        'Anda tidak memiliki izin untuk mengubah gambar ini.',
        'You do not have permission to change this image.'
      )
    default:
      return copy(
        'Gambar gagal disimpan. Silakan coba lagi.',
        'Could not save the image. Please try again.'
      )
  }
}

function serverMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('message' in body)) return null
  const { message } = body as { message: unknown }
  if (Array.isArray(message)) return message.join(', ')
  return typeof message === 'string' && message ? message : null
}

export class ImageUploadError extends Error {
  readonly status: number

  constructor(status: number, path: string, body: unknown) {
    // /auth errors are redacted server-side, and 413 may come from a proxy
    // without a JSON body, so both always use local copy.
    const message =
      isAuthPath(path) || status === 413 ? null : serverMessage(body)
    super(message ?? fallbackMessage(status))
    this.name = 'ImageUploadError'
    this.status = status
  }
}

/** Routes under /auth return the entity unwrapped; everything else is enveloped in `data`. */
export function unwrapEntity<T>(path: string, body: unknown): T {
  if (isAuthPath(path)) return body as T
  return ((body as { data?: T } | null)?.data ?? body) as T
}

async function imageRequest<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: FormData
): Promise<T> {
  const headers: Record<string, string> = {}
  // Product and employee routes need tenant context; /auth routes must not depend on it.
  if (!isAuthPath(path)) {
    const tenantId = getActiveTenantId()
    if (!tenantId) {
      throw new Error('No active tenant selected. Please select a tenant first.')
    }
    headers['x-tenant-id'] = tenantId
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // Never set Content-Type — the browser must add the multipart boundary.
      headers,
      credentials: 'include',
      body,
    })
  } catch {
    throw new ImageUploadError(0, path, null)
  }

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) notifyAuthSessionExpired()
    throw new ImageUploadError(response.status, path, json)
  }
  return unwrapEntity<T>(path, json)
}

/**
 * Upload an image as multipart/form-data. When `data` is given (create
 * endpoints), the DTO is sent JSON-encoded in a single `data` part so numbers,
 * booleans and nested arrays survive the multipart encoding.
 */
export function uploadImage<T>(
  path: string,
  field: ImageField,
  file: File,
  opts: { method?: 'POST' | 'PUT'; data?: unknown } = {}
): Promise<T> {
  const form = new FormData()
  if (opts.data !== undefined) form.append('data', JSON.stringify(opts.data))
  form.append(field, file, file.name)
  return imageRequest<T>(path, opts.method ?? 'PUT', form)
}

export function deleteImage<T>(path: string): Promise<T> {
  return imageRequest<T>(path, 'DELETE')
}
