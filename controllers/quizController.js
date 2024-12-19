const Course = require("../models/courseModel");
const Quiz = require("../models/quizModel");
const Student = require("../models/studentModel");
const Category = require("../models/categoryModel");
const CourseProgress = require("../models/courseProgressModel");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { options } = require("../routes/courseRoute");
const generateQuizUsingGemini = async (
  courseTitle,
  difficulty,
  categoryTitle,
  numQuestions
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("category", categoryTitle);

  if (!apiKey) {
    throw new Error("Missing Gemini API Key in environment variables.");
  }

  if (!courseTitle || !difficulty || !numQuestions) {
    throw new Error(
      "Invalid input: courseTitle, difficulty, or numQuestions is missing."
    );
  }

  const prompt = `
   Generate a structured quiz for an e-learning platform based on the following details:
   - **Category**: ${categoryTitle}
   - **Course Title**: ${courseTitle}
   - **Number of Questions**: ${numQuestions}
   - **Difficulty Level**: ${difficulty}
   
   ### Requirements:
   1. **Strict Uniqueness**: Ensure the questions are unique, logically accurate, and relevant to the provided category and course. Avoid repetition of similar concepts or phrasing from earlier attempts.
   2. **Diverse Questions**: Cover a variety of subtopics within the category/course to make the quiz engaging and comprehensive.
   3. **Formatting Rules**:
      - Use the exact format for each question:
        **Question:** What is the capital of France?
        **Options:** A) Paris  B) London  C) Berlin  D) Madrid
        **Correct Answer:** A) Paris
   
      - Each option must be prefixed with a letter (A, B, C, D), followed by the text. 
      - Place all options on a single line separated by spaces, like:
        **Options:** A) Option1  B) Option2  C) Option3  D) Option4
      - Indicate the correct answer with both the letter and option text:
        **Correct Answer:** A) Paris
   
   4. **Blank Line Separation**: Each question block must be separated by a blank line for readability.
   5. **No Extra Text**: Do not include any headings, explanations, or additional comments outside the structured format.
   
   ### Example:
   **Question:** What does MEAN stack stand for?  
   **Options:** A) MongoDB, Express.js, AngularJS, Node.js  B) MySQL, Express.js, Apache, Node.js  C) MongoDB, Ember.js, AngularJS, Node.js  D) MongoDB, Express.js, Angular, Node.js  
   **Correct Answer:** A) MongoDB, Express.js, AngularJS, Node.js
   
   Start generating questions now.`;

  try {
    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    // console.log(JSON.stringify(result, null, 2));

    const quizText = result.response?.candidates[0]?.content?.parts[0]?.text;
    if (!quizText) {
      throw new Error("Quiz generation failed.");
    }
    // console.log(quizText);

    const quizArray = quizText
      .split("\n\n")
      .filter((section) => section.trim())
      .map((section) => {
        const questionMatch = section.match(/\*\*Question:\*\*\s(.*?)\n/);
        const question = questionMatch ? questionMatch[1].trim() : null;

        const optionsMatch = section.match(
          /\*\*Options:\*\*\sA\)\s(.*?)\sB\)\s(.*?)\sC\)\s(.*?)\sD\)\s(.*?)(?:\n|$)/s
        );
        const options = optionsMatch
          ? [
              optionsMatch[1].trim(),
              optionsMatch[2].trim(),
              optionsMatch[3].trim(),
              optionsMatch[4].trim(),
            ]
          : [];

        const correctAnswerMatch = section.match(
          /\*\*Correct Answer:\*\*\s(.*?)(?:\n|$)/
        );
        const correctAnswer = correctAnswerMatch
          ? correctAnswerMatch[1].trim()
          : null;
        if (question && options.length === 4 && correctAnswer) {
          return {
            question,
            options,
            correctAnswer: correctAnswer
              .substring(correctAnswer.indexOf(")") + 1)
              .trim(),
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    // console.log("Quiz Array:", quizArray);

    return quizArray;
  } catch (error) {
    console.error(
      "Error generating quiz:",
      error.response?.data || error.message
    );
    throw new Error("Failed to generate quiz");
  }
};

const setupQuiz = async (course_id, student_id, numQuestions) => {
  try {
    const course = await Course.findOne({ course_id });
    if (!course) {
      throw new Error("Course not found");
    }
    const categoryData = await Category.findOne({
      _id: course.category_id,
    });
    if (!categoryData) {
      throw new Error("Category not found");
    }
    //* console.log(categoryData);
    const difficulty = course.level;
    const categoryTitle = categoryData?.title;

    const questions = await generateQuizUsingGemini(
      course.title,
      difficulty,
      categoryTitle,
      (numQuestions = 10)
    );

    //* console.log("Questions: ", questions);

    const newQuiz = new Quiz({
      course_id,
      student_id,
      questions,
      difficulty,
      createdAt: new Date(),
    });

    await newQuiz.save();

    return newQuiz;
  } catch (error) {
    console.error("Error setting up quiz:", error.message);
    throw new Error(error.message);
  }
};

const getQuizByQuizId = async (req, res) => {
  try {
    const { quiz_id } = req.params;
    const quiz = await Quiz.findOne({ _id: quiz_id });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    //* console.log(quiz)
    return res.status(200).json(quiz);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { quiz_id } = req.params;
    const { answers } = req.body;
    const quiz = await Quiz.findOne({ _id: quiz_id });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    const quizAndAnswers = setupQuestionAndAnswersToEvaluate(
      quiz?.questions,
      answers
    );
    const updateStudent = await Student.updateOne(
      { user_id: quiz.student_id },
      { $addToSet: { active_quizzes: quiz_id } }
    );
    if (!updateStudent) {
      return res.status(500).json({ error: "Failed to update student" });
    }
    const score = await calculateQuizScore(quizAndAnswers);
    await CourseProgress.updateOne(
      { course_id: quiz.course_id, student_id: quiz.student_id },
      { $set: { quiz_marks: score } }
    );
    console.log("SCORE:", score);
    return res.status(200).json({ message: "Quiz Submitted." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const calculateQuizScore = async (quizAndAnswers) => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(quizAndAnswers);

  if (!apiKey) {
    throw new Error("Missing Gemini API Key in environment variables.");
  }

  const prompt = `
   Evaluate the user's quiz answers and calculate a score out of ${
     quizAndAnswers.length
   }. The options are prefixed with numbers (e.g., 1), 2), 3), etc.) for clarity.
   
   ### Quiz Data:
   ${quizAndAnswers
     .map(
       (q, index) => ` 
      Question ${index + 1}: ${q.question}
      User's Answer: ${q.answer}
      Options: ${q.options.map((opt, i) => `${i + 1}) ${opt}`).join(", ")}
      `
     )
     .join("\n")}
   
   ### Task:
   1. Evaluate the user's answer against the provided numbered options.
   2. Assign a score of 0 to 1 for each question:
      - 1 for correct answers.
      - 0 for wrong answers.
      - Use your judgment for "nearly correct" answers (e.g., minor errors or synonyms).
   3. Calculate the total score out of ${quizAndAnswers.length}.
   4. Return the total score as an **integer** only.
   5. Be fair and honest in your assessment. Assign 0 if the answer doesn't match any option.
   6. No explanations or detailed feedback are needed; only the total score is required.
   `;

  try {
    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log(prompt);

    const result = await model.generateContent(prompt);
    const responseText =
      result.response?.candidates[0]?.content?.parts[0]?.text;

    if (!responseText) {
      throw new Error("Failed to get a response from AI.");
    }
    // *console.log(responseText);

    const score = parseInt(responseText.match(/\d+/)?.[0], 10);
    //*console.log(score);

    if (isNaN(score)) {
      throw new Error("Failed to extract a valid score from AI response.");
    }

    return score;
  } catch (error) {
    console.error(
      "Error calculating score using AI:",
      error.response?.data || error.message
    );
    throw new Error("Failed to calculate score using AI");
  }
};

const setupQuestionAndAnswersToEvaluate = (questions, answers) => {
  return questions.map((question) => ({
    question: question.question,
    answer: answers[question._id],
    options: question.options,
  }));
};

const getResultOfQuiz = async (req, res) => {
  try {
    const { quiz_id } = req.params;
    const quiz = await Quiz.findOne({ _id: quiz_id });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    const course = await Course.findOne({ course_id: quiz.course_id });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    const courseProgressData = await CourseProgress.findOne({
      course_id: quiz.course_id,
      student_id: quiz.student_id,
    });

    return res
      .status(200)
      .json({ quiz, courseProgressData, courseName: course.title });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  setupQuiz,
  getQuizByQuizId,
  submitQuiz,
  getResultOfQuiz,
};
