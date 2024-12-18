const express = require("express");
const paymentRouter = express.Router();

const {
	createOrder,
	verifyPayment,
	updateOrderStatus
} = require("../controllers/paymentController");

paymentRouter
	.post("/create-order", createOrder)
	.post("/verify-payment", verifyPayment)
	.put("/update-status", updateOrderStatus);

module.exports = paymentRouter;
