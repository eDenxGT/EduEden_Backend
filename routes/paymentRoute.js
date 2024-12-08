const express = require("express");
const paymentRouter = express.Router();

const {
	createOrder,
	verifyPayment,
} = require("../controllers/paymentController");

paymentRouter
	.post("/create-order", createOrder)
	.post("/verify-payment", verifyPayment);

module.exports = paymentRouter;
