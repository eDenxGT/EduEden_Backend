const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
	user_id: {
		type: String,
		ref: "Student",
		required: true,
	},
	courses: [
		{
			course_id: {
				type: String,
				ref: "Course",
			},
			added_at: {
				type: Date,
				default: Date.now,
			},
		},
	],
});

module.exports = mongoose.model("Cart", CartSchema);
