import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecentSmileScores } from '@/lib/actions/smileScore'
import SmileScoreSectionClient from '@/components/smile-score/SmileScoreSectionClient'

export default async function SmileScoreSection() {
  const [session, { payload: scores }] = await Promise.all([
    getServerSession(authOptions),
    getRecentSmileScores(),
  ])

  return (
    <SmileScoreSectionClient
      isLoggedIn={!!session}
      currentUserId={session?.user?.id ?? null}
      initialScores={scores ?? []}
    />
  )
}
