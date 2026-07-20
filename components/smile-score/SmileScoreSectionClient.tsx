'use client'

import { useState } from 'react'
import SmileScoreWidget from '@/components/smile-score/SmileScoreWidget'
import SmileScoreCard from '@/components/smile-score/SmileScoreCard'

type ScoreEntry = {
  id: number
  userId: number
  imageUrl: string
  score: number
  user: { name: string }
}

type Props = {
  isLoggedIn: boolean
  currentUserId: string | null
  initialScores: ScoreEntry[]
}

export default function SmileScoreSectionClient({
  isLoggedIn,
  currentUserId,
  initialScores,
}: Props) {
  const [scores, setScores] = useState(initialScores)

  function handleSaved(entry: ScoreEntry) {
    setScores((prev) => [entry, ...prev])
  }

  function handleDeleted(id: number) {
    setScores((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-col items-center gap-6 pb-24">
      {isLoggedIn && <SmileScoreWidget onSaved={handleSaved} />}

      <h2>Recent Smiles</h2>

      {scores.length === 0 ? (
        <p className="text-center text-gray-500">
          No smiles yet, be the first to upload one!
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-8 w-full max-w-4xl mx-auto">
          {scores.map((s) => (
            <SmileScoreCard
              key={s.id}
              id={s.id}
              imageUrl={s.imageUrl}
              userName={s.user.name}
              score={s.score}
              canDelete={String(s.userId) === String(currentUserId ?? '')}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
