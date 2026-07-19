'use server'

import { put, del } from '@vercel/blob'
import prisma from '@/lib/prisma'
import { requireUser } from '@/lib/actions/guard'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2mb, matches serverActions.bodySizeLimit

export async function uploadMedia(image: File) {
  const session = await requireUser()
  if (!session) {
    return { success: false, payload: null, message: 'Not authorized.' }
  }

  if (!image || image.size === 0) {
    return { success: false, payload: null, message: 'No image provided.' }
  }

  if (!ALLOWED_TYPES.includes(image.type)) {
    return { success: false, payload: null, message: 'Unsupported file type.' }
  }

  if (image.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      payload: null,
      message: 'File is too large (max 2MB).',
    }
  }

  const userId = session.user.id

  try {
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const blob = await put(`user/${userId}/${image.name}`, buffer, {
      access: 'public',
      contentType: image.type,
      addRandomSuffix: true,
    })

    return {
      success: true,
      payload: blob,
      message: 'File uploaded successfully!',
    }
  } catch (error) {
    console.error('Error in uploadMedia:', error)
    return { success: false, payload: null, message: 'Upload failed.' }
  }
}

export async function deleteMedia(_prevState: any, formData: any) {
  const session = await requireUser()
  if (!session) {
    return { success: false, payload: null, message: 'Not authorized.' }
  }

  const url = formData.get('image')?.toString().trim()
  if (!url) {
    return { success: false, payload: null, message: 'URL is required' }
  }

  try {
    const me = await prisma.user.findFirst({
      where: { id: +session.user.id, deletedAt: null },
      select: { image: true },
    })

    // Guard against deleting arbitrary blobs: the URL must be the caller's own image.
    if (!me || me.image !== url) {
      return {
        success: false,
        payload: null,
        message: 'Not authorized to delete this file.',
      }
    }

    await del(url)

    return { success: true, payload: 'Media deleted successfully' }
  } catch (error) {
    console.error('Error deleting media: ', error)
    return { success: false, payload: null, message: 'Error deleting media' }
  }
}
