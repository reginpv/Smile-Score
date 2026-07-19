'use server'

import prisma from '@/lib/prisma'
import { del } from '@vercel/blob'
import { revalidatePath, revalidateTag } from 'next/cache'
import { cacheLife, cacheTag } from 'next/cache'
import { requireUser } from '@/lib/actions/guard'

const RECENT_LIMIT = 12

async function getRecentSmileScoresData(limit: number) {
  'use cache'
  cacheTag('smile-scores')
  cacheLife('max')

  try {
    const scores = await prisma.smileScore.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })
    return { success: true, payload: scores }
  } catch {
    return { success: false, payload: [] }
  }
}

export async function getRecentSmileScores(limit: number = RECENT_LIMIT) {
  return getRecentSmileScoresData(limit)
}

export async function saveSmileScore(imageUrl: string, score: number) {
  const session = await requireUser()
  if (!session) {
    return { success: false, payload: null, message: 'Not authorized.' }
  }

  if (!imageUrl || typeof score !== 'number' || score < 0 || score > 100) {
    return {
      success: false,
      payload: null,
      message: 'Invalid smile score data.',
    }
  }

  try {
    const smileScore = await prisma.smileScore.create({
      data: {
        userId: +session.user.id,
        imageUrl,
        score: Math.round(score),
      },
      include: { user: { select: { name: true } } },
    })

    revalidateTag('smile-scores', 'max')
    revalidatePath('/')

    return { success: true, payload: smileScore }
  } catch (error) {
    console.error('Error saving smile score:', error)
    return {
      success: false,
      payload: null,
      message: 'Failed to save smile score.',
    }
  }
}

export async function deleteSmileScore(id: number) {
  const session = await requireUser()
  if (!session) {
    return { success: false, message: 'Not authorized.' }
  }

  try {
    const smileScore = await prisma.smileScore.findFirst({ where: { id } })
    if (!smileScore) {
      return { success: false, message: 'Smile score not found.' }
    }

    if (String(smileScore.userId) !== String(session.user.id)) {
      return { success: false, message: 'You can only delete your own photos.' }
    }

    try {
      await del(smileScore.imageUrl)
    } catch (blobError) {
      console.error('Error deleting blob for smile score', id, blobError)
    }

    await prisma.smileScore.delete({ where: { id } })

    revalidateTag('smile-scores', 'max')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Error deleting smile score:', error)
    return { success: false, message: 'Failed to delete smile score.' }
  }
}
