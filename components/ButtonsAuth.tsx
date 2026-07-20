'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function ButtonSignOut({ className }: { className?: string }) {
  return (
    <button
      onClick={() => {
        signOut()
      }}
      className={`button flex w-full justify-start ${className}`}
    >
      <LogOut className="inline mr-2 mb-1" />
      Logout
    </button>
  )
}
