const mongoose = require("mongoose");
const lectureSchema = new mongoose.Schema({
   title: {
      type: String,
		required: true,
	},
	video: {
      type: String,
		required: true,
	},
	lecture_id: {
		type: String,
		required: true
	},
	duration: {
      type: String,
		required: true,
	},
   course_id: {
      type: String,
      ref: "Course",
      required: true,
   },
	video_thumbnail: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	lecture_note: {
		type: String,
		required: false,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Lecture", lectureSchema);
