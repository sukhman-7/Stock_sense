import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"
import Link from 'next/link'
import { Box, Package, History, Settings, Home, LogOut, User } from 'lucide-react'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StockSense ERP',
  description: 'Inventory Management System',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex`}>
        <Toaster />
        {session && (
          <aside className="w-64 bg-white border-r flex flex-col min-h-screen sticky top-0 h-screen shrink-0">
            <div className="p-4 h-16 border-b shrink-0 flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl tracking-tight text-gray-900">StockSense</span>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                  <Home className="w-4 h-4 mr-3 text-gray-500" /> Dashboard
                </Link>
                
                <div className="pt-2">
                  <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                    <Box className="w-4 h-4 mr-3 text-gray-500" /> Operations
                  </div>
                  <div className="ml-8 space-y-1">
                    <Link href="/operations/receipts" className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900">Receipts (IN)</Link>
                    <Link href="/operations/deliveries" className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900">Delivery Orders (OUT)</Link>
                    <Link href="/operations/internal" className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900">Internal Transfers</Link>
                    <Link href="/operations/adjustments" className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900">Inventory Adjustments</Link>
                  </div>
                </div>

                <Link href="/products" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 mt-2">
                  <Package className="w-4 h-4 mr-3 text-gray-500" /> Products
                </Link>
                <Link href="/history" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 mt-2">
                  <History className="w-4 h-4 mr-3 text-gray-500" /> Move History
                </Link>
                
                {session.user?.role === 'MANAGER' && (
                  <div className="pt-2">
                    <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                      <Settings className="w-4 h-4 mr-3 text-gray-500" /> Settings
                    </div>
                    <div className="ml-8 space-y-1">
                      <Link href="/settings/warehouses" className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900">Warehouses</Link>
                      <Link href="/settings/locations" className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900">Locations</Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <div className="p-4 border-t mt-auto shrink-0 space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {session.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-sm font-medium text-gray-700 truncate">
                  {session.user?.name || session.user?.email || 'User'}
                </div>
              </div>
              <Link href="/profile" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                <User className="w-4 h-4 mr-3 text-gray-500" /> My Profile
              </Link>
              <form action="/api/auth/signout" method="POST" className="w-full">
                <button type="submit" className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                  <LogOut className="w-4 h-4 mr-3 text-gray-500" /> Logout
                </button>
              </form>
            </div>
          </aside>
        )}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
