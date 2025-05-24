const express = require("express");
const lectureRouter = express.Router();

const { verifyTutor, verifyUserBasedOnQuery } = require("../middlewares/auth");

const {
  addLecture,
  updateLecture,
  getLecturesByCourseIdForStudent,
  getLecturesByCourseIdForTutor
} = require("../controllers/lectureController");

lectureRouter
  .post("/new", verifyTutor, addLecture)
  .put("/update/:lecture_id", updateLecture)
  .get(
    "/get-by-course_id/:course_id",
    verifyUserBasedOnQuery,
    getLecturesByCourseIdForStudent
  )
  .get(
    "/get-courses-for-tutors/:course_id",
    verifyUserBasedOnQuery,
    getLecturesByCourseIdForTutor
  );

module.exports = lectureRouter;
