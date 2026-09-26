import prisma from '@/lib/prisma'
import { CreateWarehouseModal } from './CreateWarehouseModal'

export default async function WarehousesPage() {
  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { locations: true } } },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <CreateWarehouseModal />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locations Count</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {warehouses.map((wh) => (
              <tr key={wh.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{wh.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wh.shortCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wh.address || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wh._count.locations}</td>
              </tr>
            ))}
            {warehouses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No warehouses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
