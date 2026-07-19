import TemplateDefault from '@/templates/Default'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { APP_NAME } from '@/config/constants'
import SmileScoreSection from '@/components/smile-score/SmileScoreSection'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <TemplateDefault>
      <section className="h-full">
        <div className="container">
          {session && (
            <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
              <h1>{APP_NAME}</h1>

              <div>Hello {session.user.name}, you are now logged in.</div>
            </div>
          )}

          <SmileScoreSection />
        </div>
      </section>
    </TemplateDefault>
  )
}
