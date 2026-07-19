'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { deleteSmileScore } from '@/lib/actions/smileScore'

type Props = {
  id: number
  imageUrl: string
  userName: string
  score: number
  canDelete: boolean
  onDeleted: (id: number) => void
}

// Red at 0, through orange, to green at 100.
function getScoreColor(score: number) {
  const hue = (Math.max(0, Math.min(100, score)) / 100) * 120
  return `hsl(${hue}, 80%, 45%)`
}

export default function SmileScoreCard({ id, imageUrl, userName, score, canDelete, onDeleted }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    const result = await deleteSmileScore(id)
    if (result.success) {
      onDeleted(id)
    } else {
      console.error('Failed to delete smile score:', result.message)
      setIsDeleting(false)
    }
  }

  if (isDeleting) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <Image
          src={imageUrl}
          alt={`${userName}'s photo`}
          width={144}
          height={144}
          className="w-36 h-36 rounded-full object-cover"
        />

        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            title="Delete"
            className="button button--circle absolute -top-1 -right-1 !min-w-7 !min-h-7 bg-black/60 text-white hover:bg-black/80"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div
        className="text-2xl font-bold"
        style={{ color: getScoreColor(score) }}
      >
        {score}
      </div>
    </div>
  )
}
