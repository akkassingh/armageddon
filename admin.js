var admin = require("firebase-admin");

var serviceAccount = require("./tamely-2021-firebase-adminsdk-okc5z-e3d60cf420.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tamely-2021-default-rtdb.asia-southeast1.firebasedatabase.app"
})


module.exports = admin;