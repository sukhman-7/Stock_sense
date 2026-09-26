import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CreateReceiptModal } from './CreateReceiptModal'

export default async function ReceiptsPage() {
  const receipts = await prisma.stockReceipt.findMany({
    include: { location: true },
    orderBy: { createdAt: 'desc' }
  })

  const locations = await prisma.location.findMany({
    orderBy: { path: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
        <CreateReceiptModal locations={locations} />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From (Vendor)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To (Destination)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  <Link href={`/operations/receipts/${receipt.id}`}>{receipt.reference}</Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.location.path}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(receipt.scheduleDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    receipt.status === 'Done' ? 'bg-green-100 text-green-800' :
                    receipt.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                    receipt.status === 'Cancelled' || receipt.status === 'Canceled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {receipt.status}
                  </span>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No receipts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
