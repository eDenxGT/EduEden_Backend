const express = require("express");
const courseRouter = express.Router();

const {
	createCourse,
	getCoursesByTutorId,
	getAllCourses,
	getAllListedCourses,
	getCourseByCourseId,
	updateCourse,
	deleteCourseById,
	handleCourseStatus,
	getCoursesByStudentId,
	getCourseProgressByStudentId,
	updateCourseProgressByStudentId,
	updateCourseReviews
} = require("../controllers/courseController");

courseRouter
	.post("/new", createCourse)
	.put("/update/:course_id", updateCourse)
	.get("/my-courses/:tutor_id", getCoursesByTutorId)
	.get("/get-all", getAllCourses)
	.get("/get-listed", getAllListedCourses)
	.get("/get/:course_id", getCourseByCourseId)
	.delete("/delete/:course_id", deleteCourseById)
	.put("/status/:course_id", handleCourseStatus)
	.get("/student/my-courses/:student_id", getCoursesByStudentId)
	.get(`/get-progress/:student_id/:course_id`, getCourseProgressByStudentId)
	.put("/update-course-progress", updateCourseProgressByStudentId)
	.put("/review", updateCourseReviews);

module.exports = courseRouter;
