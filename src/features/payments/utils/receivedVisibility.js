import { PAYMENT_CYCLE_STATUS } from '@/constants/statuses'
import { toDate } from '@/utils/formatters'

export const RECEIVED_PAYMENT_VISIBLE_DAYS = 15
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function getPaymentReceivedDate(payment) {
  return toDate(payment.paidAt ?? payment.approvedAt ?? payment.updatedAt ?? payment.createdAt)
}

export function isPaymentReceivedVisible(payment, now = new Date()) {
  if (![PAYMENT_CYCLE_STATUS.APPROVED, PAYMENT_CYCLE_STATUS.PAID].includes(payment.status)) return true
  const receivedDate = getPaymentReceivedDate(payment)
  if (!receivedDate) return true
  return now.getTime() - receivedDate.getTime() < RECEIVED_PAYMENT_VISIBLE_DAYS * MS_PER_DAY
}
