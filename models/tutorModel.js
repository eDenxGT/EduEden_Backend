const mongoose = require("mongoose");

const TutorSchema = new mongoose.Schema(
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
			default:
				"edueden" +
				Date.now() +
				Math.floor(Math.random() * 100000 + Date.now() + 900000),
		},
		google_id: {
			type: String,
		},
		avatar: {
			type: String,
		},
		job_title: {
			type: String,
		},
		field_name: {
			type: String,
		},
		experience: {
			type: String,
		},
		is_identity_verified: {
			type: String,
			default: "pending",
		},
		bio: {
			type: String,
		},
		total_revenue: {
			type: Number,
			default: 0,
		},
		withdrawn_amount: {
			type: Number,
			default: 0,
		},
		is_blocked: {
			type: Boolean,
			default: false,
		},
		is_phone_verified: {
			type: Boolean,
			default: false,
		},
		social_profiles: {
			type: Object,
			default: {},
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
	{ collection: "tutors" }
);

module.exports = mongoose.model("Tutor", TutorSchema);
