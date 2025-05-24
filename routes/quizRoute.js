const express = require("express");
const quizRouter = express.Router();

const {
	getQuizByQuizId,
	submitQuiz,
   getResultOfQuiz
} = require("../controllers/quizController");

quizRouter
	.get("/get/:quiz_id", getQuizByQuizId)
	.post("/submit/:quiz_id", submitQuiz)
	.get("/:course_id/:quiz_id/result", getResultOfQuiz);

module.exports = quizRouter;
