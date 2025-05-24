const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
	{
		full_name: {
			type: String,
			required: true,
		},
		user_name: {
			type: String,
		},
		email: {
			type: String,
			required: true,
		},
		phone: {
			type: Number,
			required: function () {
				return this.google_id ? false : true;
			},
		},
		password: {
			type: String,
			required: function () {
				return this.google_id ? false : true;
			},
		},
		user_id: {
			type: String,
			default: "edueden"+Date.now()+Math.floor(Math.random() * 100000+ Date.now() +900000),
			required: true,

		},
		google_id: {
			type: String,
		},
		avatar: {
			type: String,
		},
		active_courses: [
			{
				type: String,
				ref: "Course",
			},
		],
		completed_quizzes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Quiz",
			},
		],
		certificates_earned: [
			{
				type: String,
			},
		],
		is_blocked: {
			type: Boolean,
			default: false,
		},
		is_phone_verified: {
			type: Boolean,
			default: false,
		},
		resetToken: {
			type: String,
		},
		resetTokenExpiry: {
			type: Date,
		},
		last_login: {
			type: Date,
		},
		created_at: {
			type: Date,
			default: Date.now,
		},
		updated_at: {
			type: Date,
			default: Date.now,
		},
	},
	{ collection: "students" }
);

module.exports = mongoose.model("Student", StudentSchema);
