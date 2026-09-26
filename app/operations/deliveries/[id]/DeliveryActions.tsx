'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { processDeliveryDemand, validateDelivery, cancelDelivery } from '@/app/actions'

interface DeliveryActionsProps {
  deliveryId: string
  status: string
}

export function DeliveryActions({ deliveryId, status }: DeliveryActionsProps) {
  const router = useRouter()

  const handleValidateDemand = async () => {
    const res = await processDeliveryDemand(deliveryId)
    if (res.error) {
      toast.error(res.error)
    } else {
      if (res.newStatus === 'Waiting') {
        toast.error('Product is not in stock. Waiting for replenishment.')
      } else {
        toast.success('Inventory reserved. Delivery is Ready.')
      }
      router.refresh()
    }
  }

  const handleValidate = async () => {
    const res = await validateDelivery(deliveryId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Delivery validated and stock deducted')
      router.refresh()
    }
  }

  const handleCancel = async () => {
    const res = await cancelDelivery(deliveryId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Delivery cancelled')
      router.refresh()
    }
  }

  return (
    <div className="flex space-x-2">
      {status === 'Draft' && (
        <button onClick={handleValidateDemand} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
          Check Availability
        </button>
      )}
      {status === 'Waiting' && (
        <button onClick={handleValidateDemand} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-medium">
          Re-check Availability
        </button>
      )}
      {status === 'Ready' && (
        <button onClick={handleValidate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">
          Validate
        </button>
      )}
      {status !== 'Done' && status !== 'Cancelled' && (
        <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
          Cancel
        </button>
      )}
    </div>
  )
}
