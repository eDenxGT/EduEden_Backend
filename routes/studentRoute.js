const express = require("express");
const studentRouter = express.Router();

const { verifyStudent } = require("../middlewares/auth");
const {
  updateStudent,
  getStudentDetails,
  getAllTutorsForStudents,
  getStudentPurchases,
  getEnrolledCourses,
  getItemsForStudentHome,
  getLandingPageData
} = require("../controllers/studentController");

studentRouter
  .put("/update-profile", verifyStudent, updateStudent)
  .get("/get-student-details/:student_id", verifyStudent, getStudentDetails)
  .get("/get-tutors", verifyStudent, getAllTutorsForStudents)
  .get("/get-purchases", verifyStudent, getStudentPurchases)
  .get("/get-enrolled-courses", verifyStudent, getEnrolledCourses)
  .get("/get-items-for-home", verifyStudent, getItemsForStudentHome)
  .get("/landing-page-data", getLandingPageData)

module.exports = studentRouter;
