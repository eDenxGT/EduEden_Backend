const express = require("express");
const studentRouter = express.Router();

const { verifyStudent } = require("../middlewares/auth");
const { updateStudent,getStudentDetails } = require("../controllers/studentController");

studentRouter
	.put("/update-profile", verifyStudent, updateStudent)
	.get("/get-student-details/:student_id", verifyStudent, getStudentDetails);

module.exports = studentRouter;
