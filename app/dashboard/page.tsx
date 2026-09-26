import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, PackageOpen, Truck, Package, History, MapPin, Building2 } from 'lucide-react'

export default async function DashboardPage() {
  const receiptsToReceive = await prisma.stockReceipt.count({
    where: { status: { in: ['Draft', 'Ready'] } }
  })
  
  const lateReceipts = await prisma.stockReceipt.count({
    where: { 
      status: { not: 'Done' },
      scheduleDate: { lt: new Date() }
    }
  })

  const totalReceipts = await prisma.stockReceipt.count({
    where: {
      status: { not: 'Done' },
      scheduleDate: { gte: new Date() }
    }
  })

  const deliveriesToDeliver = await prisma.deliveryOrder.count({
    where: { status: 'Ready' }
  })

  const lateDeliveries = await prisma.deliveryOrder.count({
    where: {
      status: { not: 'Done' },
      scheduleDate: { lt: new Date() }
    }
  })

  const waitingDeliveries = await prisma.deliveryOrder.count({
    where: { status: 'Waiting' }
  })

  const totalDeliveries = await prisma.deliveryOrder.count({
    where: {
      status: { not: 'Done' },
      scheduleDate: { gte: new Date() }
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Receipts Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
          <div className="p-5 grow">
            <div className="flex items-center">
              <div className="shrink-0 bg-blue-100 rounded-md p-3">
                <PackageOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Receipts</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{receiptsToReceive} to receive</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex space-x-4 text-sm">
                <span className="text-red-600 font-medium">{lateReceipts} Late</span>
                <span className="text-gray-500">{totalReceipts} operations</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/operations/receipts" className="font-medium text-blue-600 hover:text-blue-500 flex items-center">
                View Receipts <ArrowRight className="ml-1 w-4 h-4"/>
              </Link>
            </div>
          </div>
        </div>

        {/* Deliveries Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
          <div className="p-5 grow">
            <div className="flex items-center">
              <div className="shrink-0 bg-green-100 rounded-md p-3">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Delivery Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{deliveriesToDeliver} to Deliver</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex space-x-4 text-sm">
                <span className="text-red-600 font-medium">{lateDeliveries} Late</span>
                <span className="text-orange-600 font-medium">{waitingDeliveries} waiting</span>
                <span className="text-gray-500">{totalDeliveries} operations</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/operations/deliveries" className="font-medium text-green-600 hover:text-green-500 flex items-center">
                View Delivery Orders <ArrowRight className="ml-1 w-4 h-4"/>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Link href="/products" className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
            <Package className="h-6 w-6 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Products</span>
          </Link>
          <Link href="/history" className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
            <History className="h-6 w-6 text-gray-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Move History</span>
          </Link>
          <Link href="/operations/receipts" className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
            <PackageOpen className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Receipts</span>
          </Link>
          <Link href="/operations/deliveries" className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
            <Truck className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Deliveries</span>
          </Link>
          <Link href="/settings/warehouses" className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
            <Building2 className="h-6 w-6 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Warehouses</span>
          </Link>
          <Link href="/settings/locations" className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
            <MapPin className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Locations</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
