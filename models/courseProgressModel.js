const mongoose = require("mongoose");

const CourseProgress = new mongoose.Schema(
	{
		student_id: {
			type: String,
			ref: "Student",
			required: true,
		},
		course_id: {
			type: String,
			ref: "Course",
			required: true,
		},
		progress: [
			{
				lecture_id: {
					type: String,
					ref: "Lecture",
					required: true,
				},
				status: {
					type: String,
					enum: ["completed", "in-progress", "not-started"],
					default: "not-started",
				},
			},
		],
		overall_progress: {
      type: Number,
			default: 0,
		},
		last_accessed: {
      lecture_id: {
        type: String,
				ref: "Lecture",
			},
      last_stopped_at: {
        type: Number,
      },
		},
		quiz_marks: {
			type: Number,
			default: 0,
		},
		is_review_rated: {
			type: Boolean,
			default: false,
		},
		enrollment_date: {
			type: Date,
			default: Date.now,
		},  
	},
	{ timestamps: true, collection: "courseproggressions" }
);

module.exports = mongoose.model("CourseProgress", CourseProgress);
