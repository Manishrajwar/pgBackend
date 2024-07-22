// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayment, verifyPayment } = require("../controllers/payments")
const { auth, isInstructor, isStudent, isAdmin } = require("../middleware/auth")
router.post("/capturePayment", auth, isStudent, capturePayment)
router.post("/verifySignature",auth , isStudent , verifyPayment)

module.exports = router;