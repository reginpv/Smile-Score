import TemplateDefault from '@/templates/Default'
export default function Loading() {
  return (
    <TemplateDefault>
      <section className="animate-pulse">
        <div className="container">
          <div className="flex flex-col gap-5">
            <h1 className="w-25 bg-gray-200">&nbsp;</h1>
            <p className="w-35 bg-gray-200">&nbsp;</p>
            <p className="w-30 bg-gray-200">&nbsp;</p>
          </div>
        </div>
      </section>
    </TemplateDefault>
  )
}
