const express = require("express");
const lectureRouter = express.Router();

const { verifyTutor } = require("../middlewares/auth");

const {
	addLecture,
	updateLecture,
	getLecturesByCourseIdForStudent
} = require("../controllers/lectureController");

lectureRouter
	.post("/new",verifyTutor, addLecture)
	.put("/update/:lecture_id", updateLecture)
	.get("/get-by-course_id/:course_id", getLecturesByCourseIdForStudent)

module.exports = lectureRouter;
