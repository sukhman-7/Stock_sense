import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"
import Link from 'next/link'
import { Box, Package, History, Settings, Home, LogOut } from 'lucide-react'
import { Toaster } from 'sonner'
import { NavigationButtons } from '@/components/NavigationButtons'

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
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <Toaster />
          {session && (
            <header className="bg-white border-b shadow-sm sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <div className="shrink-0 flex items-center gap-2">
                      <Package className="h-8 w-8 text-blue-600" />
                      <span className="font-bold text-xl tracking-tight text-gray-900">StockSense</span>
                    </div>
                    <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
                      <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                        <Home className="w-4 h-4 mr-2"/> Dashboard
                      </Link>
                      <div className="relative group">
                        <button className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full">
                          <Box className="w-4 h-4 mr-2"/> Operations
                        </button>
                        <div className="absolute left-0 hidden w-48 bg-white border border-gray-200 rounded-md shadow-lg group-hover:block top-16">
                          <Link href="/operations/receipts" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Receipts (IN)</Link>
                          <Link href="/operations/deliveries" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Delivery Orders (OUT)</Link>
                        </div>
                      </div>
                      <Link href="/products" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                        <Package className="w-4 h-4 mr-2"/> Products
                      </Link>
                      <Link href="/history" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                        <History className="w-4 h-4 mr-2"/> Move History
                      </Link>
                      <div className="relative group">
                        <button className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full">
                          <Settings className="w-4 h-4 mr-2"/> Settings
                        </button>
                        <div className="absolute left-0 hidden w-48 bg-white border border-gray-200 rounded-md shadow-lg group-hover:block top-16">
                          <Link href="/settings/warehouses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Warehouses</Link>
                          <Link href="/settings/locations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Locations</Link>
                        </div>
                      </div>
                    </nav>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <form action="/api/auth/signout" method="POST">
                      <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                        <LogOut className="w-4 h-4 mr-1"/> Logout
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </header>
          )}
          <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <NavigationButtons />
            {children}
          </main>
      </body>
    </html>
  )
}
