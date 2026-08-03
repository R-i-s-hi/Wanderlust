const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const paymentsController = require("../controllers/payment.js");

router.post("/mark-failed", wrapAsync(paymentsController.markFailure));
router.post("/:id/create-order", wrapAsync(paymentsController.createOrder));
router.post("/:id/verify-payment", wrapAsync(paymentsController.verifyPayment));
router.post("/:id/create-refund", wrapAsync(paymentsController.createRefund));

module.exports = router;