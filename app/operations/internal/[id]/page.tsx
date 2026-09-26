import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TransferActions } from './TransferActions'
import { AddTransferLine } from './AddTransferLine'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function TransferDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const transfer = await prisma.internalTransfer.findUnique({
    where: { id: params.id },
    include: {
      sourceLocation: true,
      destLocation: true,
      user: true,
      lines: {
        include: { product: true }
      }
    }
  })

  if (!transfer) {
    notFound()
  }

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/operations/internal" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{transfer.reference}</h1>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
            transfer.status === 'Done' ? 'bg-green-100 text-green-800' :
            transfer.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {transfer.status}
          </span>
        </div>
        <TransferActions transferId={transfer.id} status={transfer.status} />
      </div>

      <div className="bg-white p-6 shadow rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Source Location</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{transfer.sourceLocation.path}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Destination Location</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{transfer.destLocation.path}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule Date</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
              {new Date(transfer.scheduleDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Responsible</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{transfer.user?.loginId || 'Unknown'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Line Items</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transfer.lines.map((line) => (
              <tr key={line.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.product.name} ({line.product.sku})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.quantity}</td>
              </tr>
            ))}
            {transfer.lines.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No line items.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {transfer.status !== 'Done' && transfer.status !== 'Cancelled' && (
          <div className="px-6 py-4 border-t border-gray-200">
            <AddTransferLine transferId={transfer.id} products={products} />
          </div>
        )}
      </div>
    </div>
  )
}
