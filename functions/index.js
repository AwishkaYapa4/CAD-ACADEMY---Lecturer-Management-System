const { setGlobalOptions } = require('firebase-functions/v2')

// Keep function instances close to the Firestore/Auth region to minimize
// latency; change this if the Firestore database itself lives elsewhere.
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

exports.createSystemUser = require('./src/auth/createSystemUser').createSystemUser
exports.updateSystemUser = require('./src/auth/updateSystemUser').updateSystemUser
exports.deactivateSystemUser = require('./src/auth/deactivateSystemUser').deactivateSystemUser
