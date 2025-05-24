const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema({
	student_id: {
		type: String,
		ref: "Student",
		required: true,
	},
	courses: [
		{
			type: String,
			ref: "Course",
			required: true,
		},
	],
	payment_id: {
		type: String,
	},
	order_id: {
		type: String,
		required: true,
	},
	amount: {
		type: Number,
		required: true,
	},
	status: {
		type: String,
		default: "pending",
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Order", orderSchema);
