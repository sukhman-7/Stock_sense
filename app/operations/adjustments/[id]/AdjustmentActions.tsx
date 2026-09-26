'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateAdjustmentStatus, validateAdjustment } from '@/app/actions'

interface AdjustmentActionsProps {
  adjustmentId: string
  status: string
}

export function AdjustmentActions({ adjustmentId, status }: AdjustmentActionsProps) {
  const router = useRouter()

  const handleValidate = async () => {
    const res = await validateAdjustment(adjustmentId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Adjustment validated and stock updated')
      router.refresh()
    }
  }

  const handleCancel = async () => {
    const res = await updateAdjustmentStatus(adjustmentId, 'Cancelled')
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Adjustment cancelled')
      router.refresh()
    }
  }

  return (
    <div className="flex space-x-2">
      {status === 'Draft' && (
        <button onClick={handleValidate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">
          Validate
        </button>
      )}
      {status === 'Draft' && (
        <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
          Cancel
        </button>
      )}
    </div>
  )
}
