// JSDoc-only type reference for Firestore documents. No runtime code —
// purely so editors can autocomplete/typecheck against the real schema and
// so every feature service agrees on field names. Keep in sync with
// firestore.rules whenever a collection's shape changes.

/**
 * @typedef {Object} UserDoc  // users/{uid}
 * @property {string} uid
 * @property {string} fullName
 * @property {string} email
 * @property {string} [phone]
 * @property {'admin'|'staff'|'lecturer'} role
 * @property {string} [avatarUrl]
 * @property {boolean} active
 * @property {string} [lecturerId] - set when role === 'lecturer', points to lecturers/{lecturerId}
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {string} createdBy - uid of the admin who created this account
 */

/**
 * @typedef {Object} LecturerDoc  // lecturers/{lecturerId}
 * @property {string} lecturerId
 * @property {string} userId - uid of the matching users/{uid} doc
 * @property {string} fullName
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [employeeNumber]
 * @property {string} [nic]
 * @property {string} [qualification]
 * @property {string} [address]
 * @property {string} [avatarUrl]
 * @property {boolean} active
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {string} createdBy
 */

/**
 * @typedef {Object} CourseDoc  // courses/{courseId}
 * @property {string} name
 * @property {string} [code] - legacy field; the Add/Edit Course form no longer collects it (2026-08-13), kept optional for courses created before then
 * @property {string} [description]
 * @property {string} [duration]
 * @property {string} [lecturerId]
 * @property {boolean} active
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {string} createdBy
 */

/**
 * @typedef {Object} BatchDoc  // batches/{batchId}
 * @property {string} batchCode
 * @property {string} courseId
 * @property {string} lecturerId
 * @property {import('firebase/firestore').Timestamp} startDate
 * @property {import('firebase/firestore').Timestamp} endDate
 * @property {number} plannedClassCount
 * @property {number} completedClassCount
 * @property {boolean} active
 * @property {boolean} archived
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {string} createdBy
 */

/**
 * @typedef {Object} LecturerAssignmentDoc  // lecturerAssignments/{assignmentId}
 * @property {string} lecturerId
 * @property {string} courseId
 * @property {string} batchId
 * @property {boolean} active
 * @property {import('firebase/firestore').Timestamp} assignedAt
 * @property {string} assignedBy
 */

/**
 * @typedef {Object} ClassScheduleDoc  // classSchedules/{scheduleId}
 * @property {string} lecturerId
 * @property {string} courseId
 * @property {string} batchId
 * @property {import('firebase/firestore').Timestamp} classDate
 * @property {string} startTime
 * @property {string} endTime
 * @property {'physical'|'online'} locationType
 * @property {string} [location]
 * @property {string} [zoomLink]
 * @property {'scheduled'|'draft_report'|'completed'|'cancelled'} status
 * @property {string} [reportId]
 * @property {import('firebase/firestore').Timestamp} [completedAt]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {string} createdBy
 */

/**
 * @typedef {Object} ClassReportDoc  // classReports/{reportId}
 * @property {string} scheduleId
 * @property {string} lecturerId
 * @property {string} courseId
 * @property {string} batchId
 * @property {string} topicCovered
 * @property {string} [description]
 * @property {string} [activitiesCompleted]
 * @property {string} [homework]
 * @property {string} [remarks]
 * @property {string} actualStartTime
 * @property {string} actualEndTime
 * @property {'draft'|'submitted'} status
 * @property {number} materialCount
 * @property {import('firebase/firestore').Timestamp} [submittedAt]
 * @property {import('firebase/firestore').Timestamp} [completedAt]
 * @property {boolean} paymentProcessed - client-immutable, set only by Cloud Functions
 * @property {string} [paymentId] - client-immutable, set only by Cloud Functions
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @typedef {Object} ClassMaterialDoc  // classMaterials/{materialId}
 * @property {string} reportId
 * @property {string} scheduleId
 * @property {string} lecturerId
 * @property {string} courseId
 * @property {string} batchId
 * @property {string} fileName
 * @property {string} storagePath - class-materials/{lecturerId}/{scheduleId}/{fileName}
 * @property {string} contentType
 * @property {number} size
 * @property {import('firebase/firestore').Timestamp} uploadedAt
 */

/**
 * @typedef {Object} CourseMaterialDoc  // courseMaterials/{materialId} — R2-backed lecture materials, organized by course + week
 * @property {string} courseId
 * @property {number} week
 * @property {string} title
 * @property {string} [description]
 * @property {string} originalFilename
 * @property {string} r2Key - object key in the R2 bucket, e.g. materials/{courseId}/week-{week}/{uuid}.pdf — see server/services/r2Service.js
 * @property {string} format - extension without the dot, e.g. 'pdf'
 * @property {string} mimeType
 * @property {number} sizeBytes
 * @property {string} uploadedBy - uid of the Admin/Lecturer who uploaded it
 * @property {string} [uploadedByName]
 * @property {'admin'|'lecturer'} uploadedByRole
 * @property {import('firebase/firestore').Timestamp} uploadedAt
 *
 * Unlike every other collection here, this one is NOT in
 * src/constants/collections.js and has no firestore.rules entry — it's only
 * ever read/written through the Materials API (server/, Admin SDK), never
 * directly by the Firestore client SDK. See server/services/materialsService.js
 * and src/features/materials/services/lectureMaterialService.js.
 */

/**
 * @typedef {Object} PaymentRuleDoc  // paymentRules/{ruleId} (non-monetary; readable by Admin/Staff/the owning Lecturer)
 * @property {string} id
 * @property {string} lecturerId
 * @property {string} courseId
 * @property {string} [batchId] - narrows the rule to one batch within courseId; omitted means course-wide
 * @property {string} periodMonth - 'yyyy-MM'; the month this course/batch rule applies to
 * @property {number} monthlyClassCount - manually configured number of classes the monthlyAmount is meant to cover; the divisor in paymentPerClass = monthlyAmount / monthlyClassCount (see calculateMonthlyPayment() in features/payments/utils/monthlyCalc.js), never derived from the calendar's scheduled-class count
 * @property {boolean} active
 * @property {string} [notes]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {string} createdBy
 */

/**
 * @typedef {Object} PaymentRulePrivateDoc  // paymentRules/{ruleId}/private/amount — Admin write; read by Admin/Staff/owning Lecturer (2026-08-10)
 * @property {number} monthlyAmount - the lecturer's fixed monthly payment for this rule's scope, for completing monthlyClassCount classes; see calculateMonthlyPayment() in features/payments/utils/monthlyCalc.js for how a given month's final payment is derived from it
 * @property {string} currency
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @typedef {Object} PaymentDoc  // payments/{paymentId} (non-monetary; public to Admin/Staff/own Lecturer)
 * @property {string} lecturerId
 * @property {string} [courseId]
 * @property {string} [batchId]
 * @property {string} paymentRuleId
 * @property {string} periodMonth - 'yyyy-MM'; the calendar month this payment covers. A given (paymentRuleId, periodMonth) pair is only ever approved once — see approvePayment() in features/payments/services/paymentService.js
 * @property {string[]} classIds
 * @property {number} completedClassCount
 * @property {number} totalScheduledCount - total non-cancelled classes scheduled for this rule's scope in periodMonth (informational only — NOT the payment divisor, see PaymentRuleDoc.monthlyClassCount)
 * @property {'in_progress'|'ready'|'approved'|'paid'|'cancelled'} status - in practice only 'approved'/'paid'/'cancelled' are ever persisted; 'in_progress'/'ready' are derived client-side and never written as a doc (see usePaymentReadinessSummary)
 * @property {import('firebase/firestore').Timestamp} [approvedAt]
 * @property {string} [approvedBy]
 * @property {import('firebase/firestore').Timestamp} [paidAt]
 * @property {string} [paidBy]
 * @property {string} [paymentReference]
 * @property {string} [officeNote]
 * @property {import('firebase/firestore').Timestamp} [adjustedAt]
 * @property {string} [adjustedBy]
 * @property {string} [adjustmentReason]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @typedef {Object} PaymentPrivateDoc  // payments/{paymentId}/private/amount — Admin write; read by Admin/Staff/owning Lecturer (2026-08-10)
 * @property {number} [monthlyAmount] - the rule's monthlyAmount at the time this payment was calculated (audit copy)
 * @property {number} [monthlyClassCount] - the rule's monthlyClassCount at the time this payment was calculated (audit copy)
 * @property {number} rate - payment per class for this period (monthlyAmount ÷ monthlyClassCount)
 * @property {number} [regularClassCount] - completed classes covered by the configured monthlyClassCount
 * @property {number} [regularAmount] - payment for regular monthly classes
 * @property {number} [extraClassCount] - completed classes above monthlyClassCount
 * @property {number} [extraAmount] - payment for extra classes above monthlyClassCount
 * @property {number} totalAmount - final payment (regularAmount + extraAmount)
 * @property {string} currency
 * @property {import('firebase/firestore').Timestamp} calculatedAt
 */

/**
 * @typedef {Object} NotificationDoc  // notifications/{notificationId}
 * @property {string} userId
 * @property {'admin'|'staff'|'lecturer'} role
 * @property {string} type
 * @property {string} title
 * @property {string} message
 * @property {string} [relatedId]
 * @property {boolean} read
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

export {}
