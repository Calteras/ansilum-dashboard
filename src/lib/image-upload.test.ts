import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { uploadProductPhotoApi } from '@/features/products/api/products.api'
import { createEmployeeApi } from '@/features/employees/api/employees.api'
import { uploadProfileImageApi } from '@/features/auth/api/profile.api'
import { deleteTenantLogoApi } from '@/features/auth/api/tenant.api'
import { ImageUploadError, validateImageFile } from './image-upload'

const jpeg = () => new File(['x'], 'kopi.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  useAuthStore.getState().clearAuth()
  useAuthStore.getState().setActiveTenant({
    id: 'tenant-1',
    name: 'Terra',
    slug: 'terra',
    isActive: true,
    createdAt: '',
  })
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => vi.unstubAllGlobals())

const lastRequest = () => {
  const [url, init] = vi.mocked(fetch).mock.lastCall!
  return { url, init: init! }
}

describe('validateImageFile', () => {
  it('accepts JPEG, PNG and WebP up to 10 MB', () => {
    expect(validateImageFile(jpeg())).toBeNull()
    const exact = new File([new Uint8Array(10 * 1024 * 1024)], 'a.png', {
      type: 'image/png',
    })
    expect(validateImageFile(exact)).toBeNull()
  })

  it('rejects HEIC and oversized files', () => {
    expect(
      validateImageFile(new File(['x'], 'a.heic', { type: 'image/heic' }))
    ).toMatch(/JPEG, PNG or WebP/)
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'a.webp', {
      type: 'image/webp',
    })
    expect(validateImageFile(big)).toMatch(/10 MB/)
  })
})

describe('tenant-scoped uploads', () => {
  it('sends the file field with tenant header, no Content-Type, and unwraps data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ code: 200, data: { id: 'p1', imageUrl: 'https://cdn/p1.webp?v=1' } })
    )
    const product = await uploadProductPhotoApi('p1', jpeg())

    expect(product.imageUrl).toBe('https://cdn/p1.webp?v=1')
    const { url, init } = lastRequest()
    expect(url).toBe('/api/products/p1/photo')
    expect(init.method).toBe('PUT')
    expect(init.credentials).toBe('include')
    expect(init.headers).toEqual({ 'x-tenant-id': 'tenant-1' })
    expect((init.body as FormData).get('photo')).toBeInstanceOf(File)
  })

  it('creates with a JSON-encoded data part when a photo is attached', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ code: 201, data: { id: 'e1', name: 'Jane' } })
    )
    await createEmployeeApi({
      employeeNo: 'EMP-1',
      name: 'Jane',
      pin: '1234',
      role: 'CASHIER',
      outletIds: ['o1'],
      photo: jpeg(),
    })

    const form = lastRequest().init.body as FormData
    expect(lastRequest().init.method).toBe('POST')
    expect(JSON.parse(form.get('data') as string)).toEqual({
      employeeNo: 'EMP-1',
      name: 'Jane',
      pin: '1234',
      role: 'CASHIER',
      outletIds: ['o1'],
    })
    expect(form.get('photo')).toBeInstanceOf(File)
  })

  it('surfaces specific server messages, but local copy for 413', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ message: 'Too many files' }, { status: 400 })
    )
    await expect(uploadProductPhotoApi('p1', jpeg())).rejects.toThrow(
      'Too many files'
    )

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('<html>Payload Too Large</html>', { status: 413 })
    )
    const error = await uploadProductPhotoApi('p1', jpeg()).catch((e) => e)
    expect(error).toBeInstanceOf(ImageUploadError)
    expect(error.status).toBe(413)
    expect(error.message).toMatch(/larger than 10 MB/)
  })
})

describe('auth uploads', () => {
  it('omits the tenant header and reads the unwrapped body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ id: 'u1', name: 'Saif', image: 'https://cdn/u1.webp?v=2' })
    )
    const user = await uploadProfileImageApi(jpeg())

    expect(user.image).toBe('https://cdn/u1.webp?v=2')
    const { url, init } = lastRequest()
    expect(url).toBe('/api/auth/me/image')
    expect(init.headers).toEqual({})
    expect((init.body as FormData).get('image')).toBeInstanceOf(File)
  })

  it('never shows the redacted /auth server message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(
        { message: 'Authentication request failed' },
        { status: 403 }
      )
    )
    await expect(deleteTenantLogoApi('tenant-1')).rejects.toThrow(
      'You do not have permission to change this image.'
    )
    expect(lastRequest().url).toBe('/api/auth/tenants/tenant-1/logo')
    expect(lastRequest().init.method).toBe('DELETE')
  })
})
