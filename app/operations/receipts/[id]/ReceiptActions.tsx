'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateReceiptStatus, validateReceipt } from '@/app/actions'

interface ReceiptActionsProps {
  receiptId: string
  status: string
}

export function ReceiptActions({ receiptId, status }: ReceiptActionsProps) {
  const router = useRouter()

  const handleTodo = async () => {
    const res = await updateReceiptStatus(receiptId, 'Ready')
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Receipt marked as Ready')
      router.refresh()
    }
  }

  const handleValidate = async () => {
    const res = await validateReceipt(receiptId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Receipt validated and stock updated')
      router.refresh()
    }
  }

  const handlePrint = () => {
    toast.info('Printing receipt...')
    window.print()
  }

  const handleCancel = async () => {
    const res = await updateReceiptStatus(receiptId, 'Cancelled')
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Receipt cancelled')
      router.refresh()
    }
  }

  return (
    <div className="flex space-x-2">
      {status === 'Draft' && (
        <button onClick={handleTodo} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
          TODO
        </button>
      )}
      {status === 'Ready' && (
        <button onClick={handleValidate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">
          Validate
        </button>
      )}
      {status === 'Done' && (
        <button onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium">
          Print
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
