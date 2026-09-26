'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import bcrypt from 'bcrypt'

export async function updateStockLevel(productId: string, newQuantity: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    if (session.user?.role !== 'MANAGER') throw new Error('Unauthorized')
    
    await prisma.$transaction(async (tx) => {
      // Lock the row to prevent concurrent updates reading stale onHand values
      await tx.$executeRawUnsafe(`SELECT id FROM "Product" WHERE id = '${productId}' FOR UPDATE`)
      
      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw new Error("Product not found")
      
      const difference = newQuantity - product.onHand
      
      await tx.product.update({
        where: { id: productId },
        data: { 
          onHand: newQuantity,
          freeToUse: { increment: difference }
        }
      })
    })
    
    revalidatePath('/products')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update stock level" }
  }
}

export async function validateReceipt(receiptId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }

    await prisma.$transaction(async (tx) => {
      const receipt = await tx.stockReceipt.findUnique({
        where: { id: receiptId },
        include: { lines: true }
      })
      if (!receipt || receipt.status !== 'Ready') {
        throw new Error("Invalid receipt or already processed")
      }

      // Update receipt status
      await tx.stockReceipt.update({
        where: { id: receiptId },
        data: { status: 'Done' }
      })

      // Update stock and create stock moves
      for (const line of receipt.lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: {
            onHand: { increment: line.quantity },
            freeToUse: { increment: line.quantity }
          }
        })
        
        await tx.stockMove.create({
          data: {
            reference: receipt.reference,
            productId: line.productId,
            quantity: line.quantity,
            toLocationId: receipt.locationId,
            status: 'Done'
          }
        })
      }
    })

    revalidatePath('/operations/receipts')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to validate receipt" }
  }
}

export async function validateDelivery(deliveryId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }

    await prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryOrder.findUnique({
        where: { id: deliveryId },
        include: { lines: true }
      })

      if (!delivery || delivery.status !== 'Ready') {
        throw new Error("Invalid delivery or already processed")
      }

      await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: 'Done' }
      })

      for (const line of delivery.lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: {
            onHand: { decrement: line.quantity }
            // freeToUse was already decremented during reservation
          }
        })
        
        await tx.stockMove.create({
          data: {
            reference: delivery.reference,
            productId: line.productId,
            quantity: line.quantity,
            status: 'Done'
          }
        })
      }
    })

    revalidatePath('/operations/deliveries')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to validate delivery" }
  }
}

export async function updateReceiptStatus(receiptId: string, status: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    await prisma.stockReceipt.update({
      where: { id: receiptId },
      data: { status }
    })
    revalidatePath('/operations/receipts')
    revalidatePath(`/operations/receipts/${receiptId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update receipt status" }
  }
}

export async function processDeliveryDemand(deliveryId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }

    let newStatus = '';
    await prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryOrder.findUnique({
        where: { id: deliveryId },
        include: { lines: true }
      })
      
      if (!delivery || delivery.status !== 'Draft') {
        throw new Error("Invalid delivery")
      }

      const productIds = delivery.lines.map(l => l.productId);
      if (productIds.length > 0) {
        // Using Prisma.join for the IN clause is not natively supported by $executeRaw in a way that works directly with simple arrays in all Prisma versions, 
        // but we can query them one by one or just use $executeRawUnsafe if we know the IDs are safe UUIDs.
        // Prisma 5+ supports IN (${Prisma.join(productIds)})
        await tx.$executeRawUnsafe(`SELECT id FROM "Product" WHERE id IN (${productIds.map(id => `'${id}'`).join(',')}) FOR UPDATE`);
      }

      const products = await tx.product.findMany({
        where: { id: { in: productIds } }
      })
      const productMap = new Map(products.map(p => [p.id, p]));

      let allAvailable = true;
      for (const line of delivery.lines) {
        const prod = productMap.get(line.productId);
        if (!prod || line.quantity > prod.freeToUse) {
          allAvailable = false;
          break;
        }
      }

      newStatus = allAvailable ? 'Ready' : 'Waiting';

      await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: newStatus }
      })

      if (allAvailable) {
        for (const line of delivery.lines) {
          await tx.product.update({
            where: { id: line.productId },
            data: { freeToUse: { decrement: line.quantity } }
          })
          await tx.orderLineItem.update({
            where: { id: line.id },
            data: { reservedQty: line.quantity }
          })
        }
      }
    })

    revalidatePath('/operations/deliveries')
    revalidatePath(`/operations/deliveries/${deliveryId}`)
    return { success: true, newStatus }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to process delivery" }
  }
}

export async function cancelDelivery(deliveryId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    await prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryOrder.findUnique({
        where: { id: deliveryId },
        include: { lines: true }
      })
      
      if (!delivery) throw new Error("Not found")

      if (delivery.status === 'Cancelled' || delivery.status === 'Done') {
        throw new Error("Cannot cancel a completed or already cancelled delivery")
      }

      await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: 'Cancelled' } // or whatever state is appropriate
      })
      
      // if it was Ready, we need to release reserved stock
      if (delivery.status === 'Ready') {
        for (const line of delivery.lines) {
          await tx.product.update({
            where: { id: line.productId },
            data: { freeToUse: { increment: line.quantity } }
          })
          await tx.orderLineItem.update({
            where: { id: line.id },
            data: { reservedQty: 0 }
          })
        }
      }
    })

    revalidatePath('/operations/deliveries')
    revalidatePath(`/operations/deliveries/${deliveryId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel delivery" }
  }
}

export async function createProduct(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    if (session.user?.role !== 'MANAGER') throw new Error('Unauthorized')
    
    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const cost = parseFloat(formData.get('cost') as string)
    const categoryRaw = formData.get('category') as string | null
    const category = categoryRaw && categoryRaw.trim() !== '' ? categoryRaw.trim() : null
    const unitOfMeasure = (formData.get('unitOfMeasure') as string) || 'Units'
    const initialStockStr = formData.get('initialStock') as string
    const initialStock = Number(initialStockStr) || 0
    const minReorderLevel = Number(formData.get('minReorderLevel')) || 0
    
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { name, sku, cost, category, unitOfMeasure, onHand: initialStock, freeToUse: initialStock, minReorderLevel }
      })

      if (initialStock > 0) {
        await tx.stockMove.create({
          data: {
            reference: "INIT-" + product.sku,
            quantity: initialStock,
            productId: product.id,
            status: 'Done'
          }
        })
      }
    })
    
    revalidatePath('/products')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create product" }
  }
}

export async function createWarehouse(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    if (session.user?.role !== 'MANAGER') throw new Error('Unauthorized')
    
    const name = formData.get('name') as string
    const shortCode = formData.get('shortCode') as string
    const address = formData.get('address') as string
    
    await prisma.warehouse.create({
      data: { name, shortCode, address }
    })
    
    revalidatePath('/settings/warehouses')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create warehouse" }
  }
}

export async function createLocation(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    if (session.user?.role !== 'MANAGER') throw new Error('Unauthorized')
    
    const name = formData.get('name') as string
    const shortCode = formData.get('shortCode') as string
    const warehouseId = formData.get('warehouseId') as string
    
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } })
    if (!warehouse) throw new Error("Warehouse not found")
    
    const path = `${warehouse.shortCode}/${shortCode}`
    
    await prisma.location.create({
      data: { name, shortCode, warehouseId, path }
    })
    
    revalidatePath('/settings/locations')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create location" }
  }
}

export async function createReceipt(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    if (!session.user?.email) throw new Error("No user email in session")
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw new Error("User not found in DB")
    
    const vendor = formData.get('vendor') as string
    const locationId = formData.get('locationId') as string
    const scheduleDate = new Date(formData.get('scheduleDate') as string)
    
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { warehouse: true }
    })
    if (!location) throw new Error("Location not found")
    
    const count = await prisma.stockReceipt.count()
    const autoIncrement = String(count + 1).padStart(4, '0')
    const reference = `${location.warehouse.shortCode}/IN/${autoIncrement}`
    
    await prisma.stockReceipt.create({
      data: {
        reference,
        vendor,
        locationId,
        scheduleDate,
        userId: user.id,
        status: 'Draft'
      }
    })
    
    revalidatePath('/operations/receipts')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create receipt" }
  }
}

export async function createDelivery(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    if (!session.user?.email) throw new Error("No user email in session")
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw new Error("User not found in DB")
    
    const customer = formData.get('customer') as string
    const scheduleDate = new Date(formData.get('scheduleDate') as string)
    
    const warehouse = await prisma.warehouse.findFirst()
    const whCode = warehouse ? warehouse.shortCode : 'WH'
    
    const count = await prisma.deliveryOrder.count()
    const autoIncrement = String(count + 1).padStart(4, '0')
    const reference = `${whCode}/OUT/${autoIncrement}`
    
    await prisma.deliveryOrder.create({
      data: {
        reference,
        customer,
        scheduleDate,
        userId: user.id,
        status: 'Draft'
      }
    })
    
    revalidatePath('/operations/deliveries')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create delivery" }
  }
}

export async function updateProductDetails(id: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    if (session.user?.role !== 'MANAGER') throw new Error('Unauthorized')
    
    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const cost = parseFloat(formData.get('cost') as string)
    const categoryRaw = formData.get('category') as string | null
    const category = categoryRaw && categoryRaw.trim() !== '' ? categoryRaw.trim() : null
    const unitOfMeasure = (formData.get('unitOfMeasure') as string) || 'Units'
    const minReorderLevel = Number(formData.get('minReorderLevel')) || 0
    
    await prisma.product.update({
      where: { id },
      data: { name, sku, cost, category, unitOfMeasure, minReorderLevel }
    })
    
    revalidatePath('/products')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update product" }
  }
}

export async function updateWarehouse(id: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    if (session.user?.role !== 'MANAGER') throw new Error('Unauthorized')
    
    const name = formData.get('name') as string
    const shortCode = formData.get('shortCode') as string
    const address = formData.get('address') as string
    
    await prisma.warehouse.update({
      where: { id },
      data: { name, shortCode, address }
    })
    
    revalidatePath('/settings/warehouses')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update warehouse" }
  }
}

export async function updateLocation(id: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    if (session.user?.role !== 'MANAGER') throw new Error('Unauthorized')
    
    const name = formData.get('name') as string
    const shortCode = formData.get('shortCode') as string
    const warehouseId = formData.get('warehouseId') as string
    
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } })
    if (!warehouse) throw new Error("Warehouse not found")
    
    const path = `${warehouse.shortCode}/${shortCode}`
    
    await prisma.location.update({
      where: { id },
      data: { name, shortCode, warehouseId, path }
    })
    
    revalidatePath('/settings/locations')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update location" }
  }
}

export async function createInternalTransfer(sourceId: string, destId: string, scheduleDate: Date) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    if (!session.user?.email) throw new Error("No user email in session")
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw new Error("User not found in DB")
    
    const count = await prisma.internalTransfer.count()
    const autoIncrement = String(count + 1).padStart(4, '0')
    const reference = `WH/INT/${autoIncrement}`
    
    const transfer = await prisma.internalTransfer.create({
      data: {
        reference,
        sourceLocationId: sourceId,
        destLocationId: destId,
        scheduleDate,
        userId: user.id,
        status: 'Draft'
      }
    })
    
    revalidatePath('/operations/internal')
    return { success: true, id: transfer.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create internal transfer" }
  }
}

export async function addTransferLine(transferId: string, productId: string, quantity: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }

    await prisma.transferLineItem.create({
      data: {
        transferId,
        productId,
        quantity
      }
    })
    
    revalidatePath(`/operations/internal/${transferId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add line item" }
  }
}

export async function updateTransferStatus(transferId: string, status: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    await prisma.internalTransfer.update({
      where: { id: transferId },
      data: { status }
    })
    
    revalidatePath('/operations/internal')
    revalidatePath(`/operations/internal/${transferId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update status" }
  }
}

export async function validateTransfer(transferId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.internalTransfer.findUnique({
        where: { id: transferId },
        include: { lines: true }
      })
      
      if (!transfer || transfer.status === 'Done' || transfer.status === 'Cancelled') {
        throw new Error("Invalid transfer or already processed")
      }
      
      await tx.internalTransfer.update({
        where: { id: transferId },
        data: { status: 'Done' }
      })
      
      for (const line of transfer.lines) {
        await tx.stockMove.create({
          data: {
            reference: transfer.reference,
            fromLocationId: transfer.sourceLocationId,
            toLocationId: transfer.destLocationId,
            productId: line.productId,
            quantity: line.quantity,
            status: 'Done'
          }
        })
      }
    })
    
    revalidatePath('/operations/internal')
    revalidatePath(`/operations/internal/${transferId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to validate transfer" }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal if the user exists or not for security reasons, just return success
      return { success: true };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes from now

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiry },
    });

    console.log("MOCK EMAIL SENDER - OTP for " + email + " is: " + otp);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to request password reset" };
  }
}

export async function resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "Invalid email or OTP" };
    }

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return { error: "Invalid or expired OTP" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reset password" };
  }
}

export async function createInventoryAdjustment(reason: string, date: Date, locationId?: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    if (!session.user?.email) throw new Error("No user email in session")
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw new Error("User not found in DB")
    
    const count = await prisma.inventoryAdjustment.count()
    const autoIncrement = String(count + 1).padStart(4, '0')
    const reference = `INV/ADJ/${autoIncrement}`
    
    const adjustment = await prisma.inventoryAdjustment.create({
      data: {
        reference,
        reason,
        locationId: locationId || null,
        date,
        userId: user.id,
        status: 'Draft'
      }
    })
    
    revalidatePath('/operations/adjustments')
    return { success: true, id: adjustment.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create inventory adjustment" }
  }
}

export async function addAdjustmentLine(adjustmentId: string, productId: string, countedQty: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error("Product not found")

    await prisma.adjustmentLineItem.create({
      data: {
        adjustmentId,
        productId,
        expectedQty: product.onHand,
        countedQty
      }
    })
    
    revalidatePath(`/operations/adjustments/${adjustmentId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add adjustment line" }
  }
}

export async function updateAdjustmentStatus(adjustmentId: string, status: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    await prisma.inventoryAdjustment.update({
      where: { id: adjustmentId },
      data: { status }
    })
    
    revalidatePath('/operations/adjustments')
    revalidatePath(`/operations/adjustments/${adjustmentId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update adjustment status" }
  }
}

export async function validateAdjustment(adjustmentId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return { error: "Not authenticated" }
    
    await prisma.$transaction(async (tx) => {
      // Lock the adjustment
      await tx.$executeRawUnsafe(`SELECT id FROM "InventoryAdjustment" WHERE id = '${adjustmentId}' FOR UPDATE`);

      const adjustment = await tx.inventoryAdjustment.findUnique({
        where: { id: adjustmentId },
        include: { lines: true }
      })
      
      if (!adjustment || adjustment.status === 'Applied' || adjustment.status === 'Cancelled') {
        throw new Error("Invalid adjustment or already processed")
      }

      const productIds = adjustment.lines.map(l => l.productId);
      if (productIds.length > 0) {
        await tx.$executeRawUnsafe(`SELECT id FROM "Product" WHERE id IN (${productIds.map(id => `'${id}'`).join(',')}) FOR UPDATE`);
      }
      
      await tx.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: { status: 'Applied' }
      })
      
      for (const line of adjustment.lines) {
        const delta = line.countedQty - line.expectedQty;
        
        if (delta !== 0) {
          await tx.product.update({
            where: { id: line.productId },
            data: {
              onHand: line.countedQty,
              freeToUse: { increment: delta }
            }
          })
          
          await tx.stockMove.create({
            data: {
              reference: adjustment.reference,
              productId: line.productId,
              quantity: delta,
              toLocationId: delta > 0 ? adjustment.locationId : null,
              fromLocationId: delta < 0 ? adjustment.locationId : null,
              status: 'Done'
            }
          })
        }
      }
    })
    
    revalidatePath('/operations/adjustments')
    revalidatePath(`/operations/adjustments/${adjustmentId}`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to validate adjustment" }
  }
}
