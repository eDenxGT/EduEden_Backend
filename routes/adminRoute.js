const express = require("express");
const adminRouter = express.Router();
const { verifyAdmin } = require("../middlewares/auth");

const {
	getTutors,
	toggleTutorStatus,
	getStudents,
	toggleStudentStatus,
	searchStudents,
	searchTutors,
	getTutorApplications,
	updateTutorApplicationStatus
} = require("../controllers/adminController");

adminRouter
	.get("/get-tutors", verifyAdmin, getTutors)
	.post("/toggle-tutor-status", verifyAdmin, toggleTutorStatus)
	.get("/get-students", verifyAdmin, getStudents)
	.post("/toggle-student-status", verifyAdmin, toggleStudentStatus)
	.get("/search-students", verifyAdmin, searchStudents)
	.get("/search-tutors", verifyAdmin, searchTutors)
	.get("/get-tutor-applications", verifyAdmin, getTutorApplications)
	.put("/update-tutor-status", verifyAdmin, updateTutorApplicationStatus)

module.exports = adminRouter;
