const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	category_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Category",
		required: true,
	},
	course_id: {
		type: String,
		required: true,
	},
	tutor_id: {
		type: String,
		ref: "Tutor",
		required: true,
	},
	language: {
		type: String,
		required: true,
	},
	level: {
		type: String,
		required: true,
	},
	course_thumbnail: {
		type: String,
		required: true,
	},
	course_description: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	enrolled_count: {
		type: Number,
		default: 0,
	},
	duration: {
		type: String,
		required: true,
	},
	is_listed: {
		type: Boolean,
		default: true,
	},
	average_rating: {
		type: Number,
		default: 0,
	},
	ratings_count: {
		type: Number,
		default: 0,
	},
	ratings: [Number],
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Course", courseSchema);
