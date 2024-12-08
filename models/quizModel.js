const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
	question: {
		type: String,
		required: true,
	},
	options: {
		type: [String],
		required: true,
	},
	correctAnswer: {
		type: String,
		required: true,
	},
});

const QuizSchema = new mongoose.Schema({
	course_id: {
		type: String,
		ref: "Course",
		required: true,
	},
	student_id: {
		type: String,
		ref: "Student",
		required: true,
	},
	questions: {
		type: [QuestionSchema],
		required: true,
	},
	difficulty: {
		type: String,
		default: "easy",
	},
	time_limit: {
		type: Number,
		default: 10 * 60,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Quiz", QuizSchema);
