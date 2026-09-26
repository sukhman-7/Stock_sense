import prisma from '@/lib/prisma'

export default async function HistoryPage() {
  const moves = await prisma.stockMove.findMany({
    include: {
      product: true,
      fromLocation: true,
      toLocation: true
    },
    orderBy: { date: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Move History (Audit Log)</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {moves.map((move) => {
              const isIncoming = move.reference.includes('/IN/')
              const isOutgoing = move.reference.includes('/OUT/')
              return (
                <tr key={move.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{move.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(move.date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{move.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{move.fromLocation?.path || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{move.toLocation?.path || '-'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    isIncoming ? 'text-green-600' : isOutgoing ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {isIncoming ? '+' : isOutgoing ? '-' : ''}{move.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      move.status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {move.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {moves.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No stock moves found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
