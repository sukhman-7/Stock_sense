'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

export function NavigationButtons() {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/auth' || pathname === '/') return null

  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={() => router.back()}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Previous Page
      </button>
      
      {pathname !== '/dashboard' && (
        <Link
          href="/dashboard"
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-white border border-blue-200 rounded-md px-3 py-1.5 shadow-sm transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Dashboard
        </Link>
      )}
    </div>
  )
}
