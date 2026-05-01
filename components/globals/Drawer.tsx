'use client'

import { useDrawer } from '@/store/useDrawer'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SCHOOL_NAME } from '@/config/constants'
import { X, Users } from 'lucide-react'

export default function Drawer() {
  const open = useDrawer((state) => state.show)
  const toggle = useDrawer((state) => state.toggleShow)
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAdmin =
    session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'ADMIN'

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggle}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 h-dvh w-64 z-30 animated bg-secondary md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 border-b border-tertiary border-r">
          <div className="flex items-center justify-between gap-3 h-16">
            <h1 className="">
              <Link href="/">{SCHOOL_NAME}</Link>
            </h1>

            <button className="button button--circle">
              <X onClick={toggle} />
            </button>
          </div>
        </div>

        {/* Nav */}
        {isAdmin && (
          <nav className="p-2 flex flex-col gap-1">
            <Link
              href="/dashboard/users"
              onClick={toggle}
              className={`flex items-center gap-3 px-3 py-2 rounded animated hover:bg-tertiary ${
                pathname === '/dashboard/users' ? 'bg-tertiary font-medium' : ''
              }`}
            >
              <Users size={24} />
              <span>Users</span>
            </Link>
          </nav>
        )}
      </div>
    </>
  )
}
