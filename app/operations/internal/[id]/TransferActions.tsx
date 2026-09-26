'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateTransferStatus, validateTransfer } from '@/app/actions'

interface TransferActionsProps {
  transferId: string
  status: string
}

export function TransferActions({ transferId, status }: TransferActionsProps) {
  const router = useRouter()

  const handleValidate = async () => {
    const res = await validateTransfer(transferId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Transfer validated and stock moved')
      router.refresh()
    }
  }

  const handleCancel = async () => {
    const res = await updateTransferStatus(transferId, 'Cancelled')
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Transfer cancelled')
      router.refresh()
    }
  }

  return (
    <div className="flex space-x-2">
      {status !== 'Done' && status !== 'Cancelled' && (
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
