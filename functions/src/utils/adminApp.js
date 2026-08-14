const { initializeApp, getApps } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

const app = getApps().length ? getApps()[0] : initializeApp()

const db = getFirestore(app)
const auth = getAuth(app)

module.exports = { app, db, auth, FieldValue }
