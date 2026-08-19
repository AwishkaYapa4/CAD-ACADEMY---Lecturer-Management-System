import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { useFirestoreCollection } from '@/hooks/useFirestoreCollection'
import {
  PAYMENT_RULE_ORDER,
  createPaymentRule,
  createPaymentRulesForScopes,
  getPaymentRuleAmount,
  lecturerRuleConstraints,
  paymentRulesCollection,
  setPaymentRuleActive,
  updatePaymentRule,
} from '@/features/paymentRules/services/paymentRuleService'

export function usePaymentRules() {
  return useFirestoreCollection(paymentRulesCollection.subscribe, PAYMENT_RULE_ORDER, [])
}

/** Constrained query a Lecturer is allowed to run — see lecturerRuleConstraints(). */
export function useLecturerPaymentRules(lecturerId) {
  return useFirestoreCollection(
    paymentRulesCollection.subscribe,
    lecturerId ? lecturerRuleConstraints(lecturerId) : [],
    [lecturerId]
  )
}

/** One-shot (not realtime) — Admin-write/Admin-Staff-Lecturer-read subcollection, fetched when a form/detail view needs it. */
export function usePaymentRuleAmount(ruleId, enabled = true) {
  const [amount, setAmount] = useState(null)
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!ruleId || !enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    getPaymentRuleAmount(ruleId)
      .then(setAmount)
      .finally(() => setLoading(false))
  }, [ruleId, enabled])

  return { data: amount, loading }
}

/**
 * Batch variant of usePaymentRuleAmount — fetches every ruleId's amount in
 * parallel and returns them keyed by ruleId, e.g. `{ [ruleId]: { monthlyAmount, currency, ... } }`.
 * Built for dashboard summaries that need to total a calculated payment
 * across several lecturers/rules at once (see LecturerPaymentHighlights) —
 * one hook call instead of one usePaymentRuleAmount per row, which the Rules
 * of Hooks wouldn't allow inside a .map() anyway.
 */
export function usePaymentRuleAmounts(ruleIds) {
  const [amounts, setAmounts] = useState({})
  const [loading, setLoading] = useState(ruleIds.length > 0)
  const key = ruleIds.join(',')

  useEffect(() => {
    if (ruleIds.length === 0) {
      setAmounts({})
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all(
      ruleIds.map((id) =>
        getPaymentRuleAmount(id)
          .then((amount) => [id, amount])
          // A single rejected fetch (e.g. a permission error on one rule) must
          // not sink the whole Promise.all — that left `loading` stuck true
          // forever, so the dashboard never got past its skeleton state.
          // Falling back to null here lets the batch always resolve; that
          // rule's row just renders without an amount (see hasAmount in
          // LecturerPaymentSummaryRow).
          .catch(() => [id, null])
      )
    ).then((entries) => {
      if (cancelled) return
      setAmounts(Object.fromEntries(entries))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data: amounts, loading }
}

export function useCreatePaymentRule() {
  return useMutation({
    mutationFn: async (data) => createPaymentRule(data),
  })
}

export function useCreatePaymentRulesForScopes() {
  return useMutation({
    mutationFn: async (data) => createPaymentRulesForScopes(data),
  })
}

export function useUpdatePaymentRule() {
  return useMutation({
    mutationFn: async ({ ruleId, data }) => {
      await updatePaymentRule(ruleId, data)
    },
  })
}

export function useSetPaymentRuleActive() {
  return useMutation({
    mutationFn: async ({ ruleId, active }) => {
      await setPaymentRuleActive(ruleId, active)
    },
  })
}
