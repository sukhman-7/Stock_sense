import prisma from '@/lib/prisma'
import Link from 'next/link'
import { CreateAdjustmentModal } from './CreateAdjustmentModal'

export default async function InventoryAdjustmentsPage() {
  const adjustments = await prisma.inventoryAdjustment.findMany({
    include: { location: true },
    orderBy: { createdAt: 'desc' }
  })

  const locations = await prisma.location.findMany({
    orderBy: { path: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
        <CreateAdjustmentModal locations={locations} />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adjustments.map((adj) => (
              <tr key={adj.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  <Link href={`/operations/adjustments/${adj.id}`}>{adj.reference}</Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{adj.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{adj.location?.path || 'All'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(adj.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    adj.status === 'Applied' ? 'bg-green-100 text-green-800' :
                    adj.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {adj.status}
                  </span>
                </td>
              </tr>
            ))}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No inventory adjustments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
