import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ReceiptActions } from './ReceiptActions'
import { AddReceiptLine } from './AddReceiptLine'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ReceiptDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const receipt = await prisma.stockReceipt.findUnique({
    where: { id: params.id },
    include: {
      location: true,
      user: true,
      lines: {
        include: { product: true }
      }
    }
  })

  if (!receipt) {
    notFound()
  }

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  const steps = ['Draft', 'Ready', 'Done']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/operations/receipts" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{receipt.reference}</h1>
        </div>
        <ReceiptActions receiptId={receipt.id} status={receipt.status} />
      </div>

      <div className="bg-white p-6 shadow rounded-lg mb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-2 w-full justify-center">
            {steps.map((step, idx) => (
              <div key={step} className="flex items-center">
                <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                  receipt.status === step 
                    ? 'bg-blue-600 text-white' 
                    : steps.indexOf(receipt.status) > idx 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {step}
                </span>
                {idx < steps.length - 1 && <div className="w-12 h-1 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Receive From</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{receipt.vendor}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Destination Location</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{receipt.location.path}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule Date</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
              {new Date(receipt.scheduleDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Responsible</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{receipt.user?.loginId || 'Unknown'}</div>
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
            {receipt.lines.map((line) => (
              <tr key={line.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.product.name} ({line.product.sku})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.quantity}</td>
              </tr>
            ))}
            {receipt.lines.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No line items.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {receipt.status === 'Draft' && (
          <div className="px-6 py-4 border-t border-gray-200">
            <AddReceiptLine receiptId={receipt.id} products={products} />
          </div>
        )}
      </div>
    </div>
  )
}
