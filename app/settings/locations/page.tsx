import prisma from '@/lib/prisma'
import { CreateLocationModal } from './CreateLocationModal'

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    include: { warehouse: true },
    orderBy: { path: 'asc' }
  })

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <CreateLocationModal warehouses={warehouses} />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((loc) => (
              <tr key={loc.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.path}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.shortCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.warehouse.name}</td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No locations found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
