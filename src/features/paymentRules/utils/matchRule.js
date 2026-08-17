/**
 * Specificity score for how well a rule's scope matches a given
 * lecturer/course/batch, or null if the rule doesn't apply at all.
 * Precedence: exact lecturer+course+batch > lecturer+course > lecturer-only.
 * A rule with a courseId/batchId set that doesn't match the scope is
 * excluded entirely (not a partial match) — it belongs to a different
 * course/batch and must never claim these reports.
 */
function scopeScore(rule, { lecturerId, courseId, batchId, periodMonth }) {
  if (rule.lecturerId !== lecturerId) return null
  if (rule.periodMonth && rule.periodMonth !== periodMonth) return null

  if (rule.batchId) {
    if (rule.batchId !== batchId) return null
    if (rule.courseId && rule.courseId !== courseId) return null
    return 3 + (rule.periodMonth ? 10 : 0)
  }

  if (rule.courseId) {
    if (rule.courseId !== courseId) return null
    return 2 + (rule.periodMonth ? 10 : 0)
  }

  return 1 + (rule.periodMonth ? 10 : 0)
}

/**
 * Finds the most specific active rule matching a lecturer/course/batch
 * scope. Every rule written before course/batch scoping existed has neither
 * field set, so it only ever matches at the lowest (lecturer-only)
 * precedence tier — existing rules keep matching exactly as they did
 * before this helper existed.
 */
export function matchPaymentRuleForScope(rules, scope) {
  let best = null
  let bestScore = -1

  for (const rule of rules) {
    const score = scopeScore(rule, scope)
    if (score !== null && score > bestScore) {
      best = rule
      bestScore = score
    }
  }

  return best
}
