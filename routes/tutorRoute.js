const express = require("express");
const tutorRouter = express.Router();

const { verifyTutor } = require("../middlewares/auth");

const {
  updateTutor,
  getTutorDetails,
  getTutorEarnings,
  getTutorWithdrawals,
  withdrawTutorEarnings,
  addCard,
  getCourseDetailsByTutorId,
} = require("../controllers/tutorController");

tutorRouter
  .put("/update-profile", verifyTutor, updateTutor)
  .get("/get-details", verifyTutor, getTutorDetails)
  .get("/get-earnings", verifyTutor, getTutorEarnings)
  .get("/get-withdrawals", verifyTutor, getTutorWithdrawals)
  .get("/get-courses", verifyTutor, getCourseDetailsByTutorId)
  .post("/withdraw", verifyTutor, withdrawTutorEarnings)
  .post("/add-card", verifyTutor, addCard);

module.exports = tutorRouter;
