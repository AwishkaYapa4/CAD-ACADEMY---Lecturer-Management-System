import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

import { db } from '@/config/firebase'
import { COLLECTIONS, PRIVATE_AMOUNT_DOC_ID, PRIVATE_SUBCOLLECTION } from '@/constants/collections'
import { createFirestoreService, orderBy, where } from '@/services/firestoreService'

export const paymentRulesCollection = createFirestoreService(COLLECTIONS.PAYMENT_RULES)

export const PAYMENT_RULE_ORDER = [orderBy('createdAt', 'desc')]

function privateAmountRef(ruleId) {
  return doc(db, COLLECTIONS.PAYMENT_RULES, ruleId, PRIVATE_SUBCOLLECTION, PRIVATE_AMOUNT_DOC_ID)
}

/**
 * The lecturer's fixed monthly payment for this rule's scope — readable by
 * Admin, Staff, and the owning Lecturer per firestore.rules (2026-08-10: the
 * calculated payment amount is visible to all three roles), writable by
 * Admin only. Same private-subcollection *write* boundary used for
 * `payments/{id}/private/amount` (see firestore-security-design memory).
 */
export async function getPaymentRuleAmount(ruleId) {
  const snapshot = await getDoc(privateAmountRef(ruleId))
  return snapshot.exists() ? snapshot.data() : null
}

// Matches the ownsLecturerId() read rule structurally (same field/value),
// which Firestore requires for a lecturer to `list` this collection at all —
// an unconstrained query would be rejected outright since Firestore can't
// verify every result satisfies the rule without a matching query filter.
export function lecturerRuleConstraints(lecturerId) {
  return [where('lecturerId', '==', lecturerId), orderBy('createdAt', 'desc')]
}

/**
 * A lecturer may only have one active rule per course/batch scope — a
 * course-wide rule (batchId: null) and a rule scoped to one specific batch
 * within that same course are allowed to coexist, since matchRule.js treats
 * the batch-scoped one as more specific and prefers it for that batch's reports.
 */
async function assertNoDuplicateActiveRule({ lecturerId, courseId, batchId, excludeRuleId }) {
  const existing = await paymentRulesCollection.getAll([where('lecturerId', '==', lecturerId)])
  const clash = existing.find(
    (r) =>
      r.id !== excludeRuleId &&
      r.active !== false &&
      r.courseId === courseId &&
      (r.batchId || null) === (batchId || null)
  )
  if (clash) {
    throw new Error('This lecturer already has an active payment rule for this course/batch.')
  }
}

/**
 * Creates a monthly payment rule: assigns a lecturer a fixed monthly amount
 * for a configured number of classes per month (`monthlyClassCount`),
 * optionally narrowed to one batch. `monthlyClassCount` is non-monetary so it
 * lives on the public rule doc (a lecturer can see their own target class
 * count); the amount itself goes in the Admin-write `private/amount`
 * subcollection (readable by Admin/Staff/owning Lecturer, see
 * getPaymentRuleAmount()), never on the public doc.
 */
export async function createPaymentRule({
  lecturerId,
  courseId,
  batchId,
  monthlyClassCount,
  monthlyAmount,
  currency,
  notes,
}) {
  await assertNoDuplicateActiveRule({ lecturerId, courseId, batchId })

  const ruleId = await paymentRulesCollection.create({
    lecturerId,
    courseId,
    batchId: batchId || null,
    monthlyClassCount: Number(monthlyClassCount) || 0,
    active: true,
    notes: notes || '',
  })

  await setDoc(privateAmountRef(ruleId), {
    monthlyAmount: Number(monthlyAmount) || 0,
    currency,
    updatedAt: serverTimestamp(),
  })

  return ruleId
}

export async function updatePaymentRule(
  ruleId,
  { lecturerId, courseId, batchId, monthlyClassCount, monthlyAmount, currency, notes }
) {
  await assertNoDuplicateActiveRule({ lecturerId, courseId, batchId, excludeRuleId: ruleId })

  await paymentRulesCollection.update(ruleId, {
    courseId,
    batchId: batchId || null,
    monthlyClassCount: Number(monthlyClassCount) || 0,
    notes: notes || '',
  })

  await setDoc(
    privateAmountRef(ruleId),
    { monthlyAmount: Number(monthlyAmount) || 0, currency, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export async function setPaymentRuleActive(ruleId, active) {
  await paymentRulesCollection.update(ruleId, { active })
}
