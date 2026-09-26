import prisma from '@/lib/prisma'
import { ProductTable } from './ProductTable'
import { CreateProductModal } from './CreateProductModal'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products & Stock</h1>
        <CreateProductModal />
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <ProductTable products={products} />
      </div>
    </div>
  )
}
