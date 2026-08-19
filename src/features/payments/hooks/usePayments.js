import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import {
  PAYMENT_ORDER,
  adjustPayment,
  approvePayment,
  confirmPaymentReceived,
  getPaymentAmount,
  lecturerPaymentConstraints,
  markPaymentPaid,
  paymentsCollection,
} from '@/features/payments/services/paymentService'

export function usePayments() {
  return useFirestoreCollection(paymentsCollection.subscribe, PAYMENT_ORDER, [])
}

/** Constrained query a Lecturer is allowed to run — see lecturerPaymentConstraints(). */
export function useLecturerPayments(lecturerId) {
  return useFirestoreCollection(
    paymentsCollection.subscribe,
    lecturerId ? lecturerPaymentConstraints(lecturerId) : [],
    [lecturerId]
  )
}

/** One-shot (not realtime) — Admin-write/Admin-Staff-Lecturer-read subcollection, fetched when a row/dialog needs it. */
export function usePaymentAmount(paymentId, enabled = true) {
  const [amount, setAmount] = useState(null)
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!paymentId || !enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    getPaymentAmount(paymentId)
      .then(setAmount)
      .finally(() => setLoading(false))
  }, [paymentId, enabled])

  return { data: amount, loading }
}

export function useApprovePayment() {
  return useMutation({
    mutationFn: async (data) => approvePayment(data),
  })
}

export function useMarkPaymentPaid() {
  return useMutation({
    mutationFn: async ({ paymentId, data }) => {
      await markPaymentPaid(paymentId, data)
    },
  })
}

export function useConfirmPaymentReceived() {
  return useMutation({
    mutationFn: async (paymentId) => {
      await confirmPaymentReceived(paymentId)
    },
  })
}

export function useAdjustPayment() {
  return useMutation({
    mutationFn: async ({ paymentId, data }) => {
      await adjustPayment(paymentId, data)
    },
  })
}
