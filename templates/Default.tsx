import Header from '@/components/globals/Header'
import Footer from '@/components/globals/Footer'
import Drawer from '@/components/globals/Drawer'

export default async function TemplateDefault({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="bg-primary">{children}</main>
      <Footer />
      <Drawer />
    </>
  )
}
