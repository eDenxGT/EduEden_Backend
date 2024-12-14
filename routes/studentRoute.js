const express = require("express");
const studentRouter = express.Router();

const { verifyStudent } = require("../middlewares/auth");
const {
  updateStudent,
  getStudentDetails,
  getAllTutorsForStudents,
  getStudentPurchases
} = require("../controllers/studentController");

studentRouter
  .put("/update-profile", verifyStudent, updateStudent)
  .get("/get-student-details/:student_id", verifyStudent, getStudentDetails)
  .get("/get-tutors", verifyStudent, getAllTutorsForStudents)
  .get("/get-purchases", verifyStudent, getStudentPurchases);

module.exports = studentRouter;
