import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'

import { db } from '@/config/firebase'
import { COLLECTIONS, PRIVATE_AMOUNT_DOC_ID, PRIVATE_SUBCOLLECTION } from '@/constants/collections'
import { PAYMENT_CYCLE_STATUS } from '@/constants/statuses'
import { createFirestoreService, orderBy, where } from '@/services/firestoreService'

export const paymentsCollection = createFirestoreService(COLLECTIONS.PAYMENTS)
export const PAYMENT_ORDER = [orderBy('createdAt', 'desc')]

// Matches the ownsLecturerId() branch of the read rule structurally, same
// reasoning as paymentRuleService's lecturerRuleConstraints().
export function lecturerPaymentConstraints(lecturerId) {
  return [where('lecturerId', '==', lecturerId), orderBy('createdAt', 'desc')]
}

function privateAmountRef(paymentId) {
  return doc(db, COLLECTIONS.PAYMENTS, paymentId, PRIVATE_SUBCOLLECTION, PRIVATE_AMOUNT_DOC_ID)
}

/**
 * First persisted step of the payment lifecycle: creates the payment doc at
 * 'approved' and locks every counted report (paymentProcessed: true) so they
 * can never be picked up by a second readiness cycle — this happens at
 * Approve, not at Paid, since "approved but not yet paid" must still count
 * as spoken for. classIds/totalScheduledCount/periodMonth are fixed here;
 * markPaymentPaid only ever adds payment-reference details, never reshuffles
 * which classes are included (see adjustPayment for the one exception, which
 * requires a reason and is Admin-only).
 *
 * `periodMonth` ('yyyy-MM') is what makes a rule's month payable only once —
 * usePaymentReadinessSummary treats any rule with an approved/paid payment
 * for that same month as already spoken for, so re-approving the same
 * rule+month is a UI-level block, not enforced by firestore.rules (there's
 * no server layer — see project memory on the client-only security model).
 */
export async function approvePayment({
  lecturerId,
  courseId,
  batchId,
  paymentRuleId,
  periodMonth,
  completedSchedules,
  totalScheduledCount,
  monthlyClassCount,
  monthlyAmount,
  rate,
  totalAmount,
  currency,
  approvedBy,
}) {
  const paymentRef = doc(paymentsCollection.colRef())
  const batchWrite = writeBatch(db)

  batchWrite.set(paymentRef, {
    lecturerId,
    courseId: courseId ?? null,
    batchId: batchId ?? null,
    paymentRuleId,
    periodMonth,
    classIds: completedSchedules.map((s) => s.id),
    completedClassCount: completedSchedules.length,
    totalScheduledCount: totalScheduledCount ?? completedSchedules.length,
    status: PAYMENT_CYCLE_STATUS.APPROVED,
    approvedAt: serverTimestamp(),
    approvedBy: approvedBy || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  completedSchedules.forEach((schedule) => {
    batchWrite.update(doc(db, COLLECTIONS.CLASS_REPORTS, schedule.id), {
      paymentProcessed: true,
      paymentId: paymentRef.id,
      updatedAt: serverTimestamp(),
    })
  })

  await batchWrite.commit()

  await setDoc(privateAmountRef(paymentRef.id), {
    monthlyAmount,
    monthlyClassCount: monthlyClassCount ?? null,
    rate,
    totalAmount,
    currency,
    calculatedAt: serverTimestamp(),
  })

  return paymentRef.id
}

/** Second step: an already-approved payment gets marked paid with the actual transfer details. */
export async function markPaymentPaid(paymentId, { paymentReference, officeNote }) {
  await paymentsCollection.update(paymentId, {
    status: PAYMENT_CYCLE_STATUS.PAID,
    paidAt: serverTimestamp(),
    paymentReference: paymentReference || '',
    officeNote: officeNote || '',
  })
}

/**
 * Admin-only correction to an approved/paid payment's amount or reference
 * details — never reshuffles which classes/reports are included, since that
 * would touch classReports.paymentProcessed and is a materially bigger
 * change than "adjust a payment." Always requires a reason.
 */
export async function adjustPayment(paymentId, { reason, totalAmount, paymentReference, officeNote, adjustedBy }) {
  if (!reason || !reason.trim()) {
    throw new Error('A reason is required to adjust a payment.')
  }

  const updates = { adjustedAt: serverTimestamp(), adjustedBy: adjustedBy || '', adjustmentReason: reason.trim() }
  if (paymentReference !== undefined) updates.paymentReference = paymentReference
  if (officeNote !== undefined) updates.officeNote = officeNote
  await paymentsCollection.update(paymentId, updates)

  if (totalAmount !== undefined && totalAmount !== null) {
    await setDoc(privateAmountRef(paymentId), { totalAmount: Number(totalAmount) || 0 }, { merge: true })
  }
}

/** Readable by Admin, Staff, and the owning Lecturer per firestore.rules (2026-08-10) — writable by Admin only. */
export async function getPaymentAmount(paymentId) {
  const snapshot = await getDoc(privateAmountRef(paymentId))
  return snapshot.exists() ? snapshot.data() : null
}
