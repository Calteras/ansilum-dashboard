import { deleteImage, uploadImage } from '@/lib/image-upload'
import type { User } from './auth.types'

const PROFILE_IMAGE_PATH = '/auth/me/image'

/**
 * Upload or replace the session user's profile image.
 * Auth routes return the user unwrapped and need no tenant context.
 */
export function uploadProfileImageApi(file: File): Promise<User> {
  return uploadImage<User>(PROFILE_IMAGE_PATH, 'image', file)
}

/**
 * Remove the session user's profile image
 */
export function deleteProfileImageApi(): Promise<User> {
  return deleteImage<User>(PROFILE_IMAGE_PATH)
}
