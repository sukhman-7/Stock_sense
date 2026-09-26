import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Password@123', 10)
  
  const user = await prisma.user.upsert({
    where: { loginId: 'admin' },
    update: {},
    create: {
      loginId: 'admin',
      email: 'admin@stocksense.com',
      password: hashedPassword,
    },
  })

  const wh = await prisma.warehouse.upsert({
    where: { shortCode: 'WH' },
    update: {},
    create: {
      name: 'Central Warehouse',
      shortCode: 'WH',
      address: '123 Supply Chain Rd',
    },
  })

  const loc1 = await prisma.location.upsert({
    where: { path: 'WH/Stock1' },
    update: {},
    create: {
      name: 'Stock 1',
      shortCode: 'Stock1',
      warehouseId: wh.id,
      path: 'WH/Stock1',
    },
  })

  const loc2 = await prisma.location.upsert({
    where: { path: 'WH/Stock2' },
    update: {},
    create: {
      name: 'Stock 2',
      shortCode: 'Stock2',
      warehouseId: wh.id,
      path: 'WH/Stock2',
    },
  })

  const prod1 = await prisma.product.upsert({
    where: { sku: 'DESK-001' },
    update: {},
    create: {
      name: 'Office Desk',
      sku: 'DESK-001',
      cost: 150.00,
      onHand: 50,
      freeToUse: 50,
    },
  })

  const prod2 = await prisma.product.upsert({
    where: { sku: 'TABLE-002' },
    update: {},
    create: {
      name: 'Conference Table',
      sku: 'TABLE-002',
      cost: 300.00,
      onHand: 10,
      freeToUse: 10,
    },
  })

  // Create sample operations
  const receipt = await prisma.stockReceipt.upsert({
    where: { reference: 'WH/IN/0001' },
    update: {},
    create: {
      reference: 'WH/IN/0001',
      vendor: 'Furniture Co',
      locationId: loc1.id,
      scheduleDate: new Date(),
      status: 'Ready',
      userId: user.id,
      lines: {
        create: [
          { productId: prod1.id, quantity: 20 },
        ]
      }
    }
  })

  const delivery = await prisma.deliveryOrder.upsert({
    where: { reference: 'WH/OUT/0001' },
    update: {},
    create: {
      reference: 'WH/OUT/0001',
      customer: 'Acme Corp',
      scheduleDate: new Date(),
      status: 'Waiting',
      userId: user.id,
      lines: {
        create: [
          { productId: prod2.id, quantity: 15, reservedQty: 10 },
        ]
      }
    }
  })

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
