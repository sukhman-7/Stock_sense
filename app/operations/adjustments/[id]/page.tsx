import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AdjustmentActions } from './AdjustmentActions'
import { AddAdjustmentLine } from './AddAdjustmentLine'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdjustmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const adjustment = await prisma.inventoryAdjustment.findUnique({
    where: { id: params.id },
    include: {
      location: true,
      user: true,
      lines: {
        include: { product: true }
      }
    }
  })

  if (!adjustment) {
    notFound()
  }

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/operations/adjustments" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{adjustment.reference}</h1>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
            adjustment.status === 'Applied' ? 'bg-green-100 text-green-800' :
            adjustment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {adjustment.status}
          </span>
        </div>
        <AdjustmentActions adjustmentId={adjustment.id} status={adjustment.status} />
      </div>

      <div className="bg-white p-6 shadow rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{adjustment.reason}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{adjustment.location?.path || 'All'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
              {new Date(adjustment.date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Responsible</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{adjustment.user?.loginId || 'Unknown'}</div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counted Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delta</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adjustment.lines.map((line) => {
              const delta = line.countedQty - line.expectedQty
              return (
                <tr key={line.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.product.name} ({line.product.sku})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.expectedQty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.countedQty}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </td>
                </tr>
              )
            })}
            {adjustment.lines.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No line items.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {adjustment.status === 'Draft' && (
          <div className="px-6 py-4 border-t border-gray-200">
            <AddAdjustmentLine adjustmentId={adjustment.id} products={products} />
          </div>
        )}
      </div>
    </div>
  )
}
