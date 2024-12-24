const Course = require("../models/courseModel");
const Category = require("../models/categoryModel");
const Lecture = require("../models/lectureModel");
const Student = require("../models/studentModel");
const CourseProgress = require("../models/courseProgressModel");

const { setupQuiz } = require("../controllers/quizController");
const { default: mongoose } = require("mongoose");

const createCourse = async (req, res) => {
  const {
    course_id,
    title,
    category,
    duration,
    language,
    level,
    course_description,
    course_thumbnail,
    price,
    tutor_id,
  } = req.body;

  try {
    const categoryData = await Category.findOne({ title: category });
    const course = new Course({
      course_id,
      title,
      category_id: categoryData._id,
      duration,
      language,
      level,
      course_description,
      course_thumbnail,
      price,
      tutor_id,
    });
    await course.save();
    return res
      .status(201)
      .json({ message: "Course created successfully", course });
  } catch (error) {
    console.log("Create Course error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateCourse = async (req, res) => {
  const {
    course_id,
    title,
    category,
    duration,
    language,
    level,
    course_description,
    course_thumbnail,
    price,
    deletedLectures,
  } = req.body;

  try {
    const categoryData = await Category.findOne({ title: category });

    const course = await Course.findOne({ course_id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.title !== title) {
      course.title = title;
    }
    if (course.category_id.toString() !== categoryData._id.toString()) {
      course.category_id = categoryData._id;
    }
    if (course.duration !== duration) {
      course.duration = duration;
    }
    if (course.language !== language) {
      course.language = language;
    }
    if (course.level !== level) {
      course.level = level;
    }
    if (course.course_description !== course_description) {
      course.course_description = course_description;
    }
    if (course.course_thumbnail !== course_thumbnail) {
      course.course_thumbnail = course_thumbnail;
    }
    if (course.price !== price) {
      course.price = price;
    }

    if (deletedLectures.length > 0) {
      const lecturesDeleted = await Lecture.deleteMany({
        lecture_id: { $in: deletedLectures },
      });
      // console.log(deletedLectures, lecturesDeleted);
      // if (lecturesDeleted.deletedCount !== deletedLectures.length) {
      //   return res
      //     .status(500)
      //     .json({ message: "Some lectures could not be deleted" });
      // }
    }

    delete course.deletedLectures;

    course.updated_at = Date.now();

    await course.save();

    return res
      .status(200)
      .json({ message: "Course updated successfully", course });
  } catch (error) {
    console.log("Update Course error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCoursesByTutorId = async (req, res) => {
  try {
    const { tutor_id } = req.params;
    const {
      search,
      sort,
      category,
      page = 1,
      limit = 12,
      listing_status,
    } = req.query;
    console.log(req.query, req.params);
    const filters = { tutor_id };
    if (search) {
      filters.title = { $regex: search, $options: "i" };
    }
    if (category && category !== "all") {
      filters.category_id = new mongoose.Types.ObjectId(category);
    }
    if (listing_status !== "all") {
      filters.is_listed = listing_status === "listed";
    }

    let sortStage = {};
    if (sort === "date_newest") sortStage.created_at = -1;
    if (sort === "date_oldest") sortStage.created_at = 1;
    if (sort === "title_asc") sortStage.title = 1;
    if (sort === "title_desc") sortStage.title = -1;
    if (sort === "price_low_to_high") sortStage.price = 1;
    if (sort === "price_high_to_low") sortStage.price = -1;

    const skip = (page - 1) * limit;
    console.log(filters);
    const [courses, total] = await Promise.all([
      Course.aggregate([
        { $match: filters },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $project: {
            course_id: 1,
            title: 1,
            category: "$category.title",
            category_id: 1,
            duration: 1,
            language: 1,
            level: 1,
            course_description: 1,
            course_thumbnail: 1,
            price: 1,
            enrolled_count: 1,
            is_listed: 1,
            created_at: 1,
            updated_at: 1,
            average_rating: 1,
            ratings_count: 1,
          },
        },
        ...(Object.keys(sortStage).length ? [{ $sort: sortStage }] : []),
        { $skip: skip },
        { $limit: parseInt(limit) },
      ]),
      Course.countDocuments(filters),
    ]);

    console.log(courses, total);

    return res.status(200).json({ courses, total });
  } catch (error) {
    console.error("Error fetching tutor courses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCoursesByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const student = await Student.findOne({
      user_id: student_id,
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (student.active_courses.length === 0) {
      return res.status(200).json({ courses: [] });
    }
    const coursesEnrolledByStudent = await Course.find({
      course_id: { $in: student.active_courses },
      is_listed: true,
    });

    // console.log(coursesEnrolledByStudent);
    return res.status(200).json({ courses: coursesEnrolledByStudent });
  } catch (error) {
    console.log("Get Courses By Student Id error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const { apiFor } = req.query;
    const courses = await Course.find().populate("category_id", "title");
    console.log(courses);
    if (apiFor === "ordersList") {
      const coursesDataToSend = courses.map((course) => ({
        course_id: course.course_id,
        title: course.title,
      }));
      return res.status(200).json({ courses: coursesDataToSend });
    }
    if (apiFor === "forPurchaseHistory") {
      availableCourses = courses.filter((course) => course.is_listed === true);
      const coursesDataToSend = availableCourses.map((course) => ({
        course_id: course.course_id,
        title: course.title,
      }));
      return res.status(200).json({ courses: coursesDataToSend });
    }
    return res.status(200).json({ courses });
  } catch (error) {
    console.log("Get All Courses error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllListedCourses = async (req, res) => {
  try {
    const { search, sort, category, tutor, page = 1, limit = 12 } = req.query;

    const filters = {};
    if (search) {
      filters.title = { $regex: search, $options: "i" };
    }
    if (category && category !== "all") {
      filters.category_id = category;
    }
    if (tutor && tutor !== "all") {
      filters.tutor_id = tutor;
    }

    let sortOptions = {};
    if (sort === "date_newest") sortOptions.created_at = -1;
    if (sort === "date_oldest") sortOptions.created_at = 1;
    if (sort === "title_asc") sortOptions.title = 1;
    if (sort === "title_desc") sortOptions.title = -1;
    if (sort === "price_low_to_high") sortOptions.price = 1;
    if (sort === "price_high_to_low") sortOptions.price = -1;

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(filters).sort(sortOptions).skip(skip).limit(parseInt(limit)),
      Course.countDocuments(filters),
    ]);

    res.status(200).json({ courses, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

const getCourseByCourseId = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { apiFor } = req.query;
    const { user_id } = req.user;
    console.log(user_id);

    if (apiFor === "studentPurchasedCourse") {
      const student = await Student.findOne({ user_id });
      console.log(student);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (!student.active_courses.includes(course_id)) {
        return res.status(404).json({ message: "Course not found" });
      }
    }

    const course = await Course.aggregate([
      { $match: { course_id } },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $lookup: {
          from: "lectures",
          localField: "course_id",
          foreignField: "course_id",
          as: "lectures",
        },
      },
      {
        $lookup: {
          from: "tutors",
          localField: "tutor_id",
          foreignField: "user_id",
          as: "tutor",
        },
      },
      {
        $unwind: "$tutor",
      },
      {
        $project: {
          course_id: 1,
          title: 1,
          category: "$category.title",
          duration: 1,
          language: 1,
          level: 1,
          course_description: 1,
          course_thumbnail: 1,
          price: 1,
          enrolled_count: 1,
          is_listed: 1,
          created_at: 1,
          updated_at: 1,
          average_rating: 1,
          ratings_count: 1,
          lectures: 1,
          tutor_name: "$tutor.full_name",
          tutor_avatar: "$tutor.avatar",
        },
      },
    ]);

    if (course.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (apiFor === "studentSingleCourse") {
      if (course[0].is_listed === false) {
        return res.status(404).json({ message: "Course not found" });
      }
      return res.status(200).json({ course: course[0] });
    }

    return res.status(200).json({ course: course[0] });
  } catch (error) {
    console.log(req.user);
    console.log("Get Course By Course Id error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCourseById = async (req, res) => {
  try {
    const { course_id } = req.params;

    const deletedCourse = await Course.deleteOne({ course_id });
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res
      .status(200)
      .json({ message: "Course deleted successfully", course_id });
  } catch (error) {
    console.log("Delete Course By Id error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const handleCourseStatus = async (req, res) => {
  try {
    const { course_id } = req.params;
    const course = await Course.findOne({ course_id }).populate(
      "category_id",
      "title"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.is_listed = !course.is_listed;

    await course.save();
    return res
      .status(200)
      .json({ message: "Course status updated successfully", course });
  } catch (err) {
    console.log("Course Status toggling error", err);
  }
};

const getCourseProgressByStudentId = async (req, res) => {
  try {
    const { course_id, student_id } = req.params;

    const courseProgress = await CourseProgress.findOne({
      course_id,
      student_id,
    });

    if (!courseProgress) {
      return res.status(404).json({ message: "Course progress not found" });
    }

    return res.status(200).json({ courseProgress });
  } catch (error) {
    console.log("Get Course Progress By Student Id error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateCourseProgressByStudentId = async (req, res) => {
  try {
    const { course_id, student_id, lecture_id, status } = req.body;
    console.log(req.body);

    const result = await CourseProgress.findOneAndUpdate(
      {
        course_id,
        student_id,
        "progress.lecture_id": lecture_id,
      },
      {
        $set: {
          "progress.$.status": status,
        },
      },
      { new: true }
    );
    // console.log(result);
    if (!result) {
      return res.status(404).json({ message: "Course progress not found" });
    }

    const allCompleted = result?.progress?.every(
      (lecture) => lecture.status === "completed"
    );

    if (allCompleted && result?.quiz_marks < 7) {
      const quiz = await setupQuiz(course_id, student_id, (numQuestions = 10));
      return res.status(200).json({ message: "Course completed", quiz });
    }

    // console.log(allCompleted)

    return res.status(200).json({
      message: "Course progress updated successfully",
      progress: result.progress,
    });
  } catch (error) {
    console.error("Update Course Progress error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateCourseReviews = async (req, res) => {
  try {
    const { course_id, rating, student_id } = req.body;
    const courseProgressOfStudent = await CourseProgress.findOne({
      course_id,
      student_id,
    });
    if (courseProgressOfStudent?.is_review_rated === true) {
      return res.status(400).json({ message: "You already rated this course" });
    }
    courseProgressOfStudent.is_review_rated = true;
    const courseUpdated = await Course.updateOne({ course_id }, [
      {
        $set: {
          ratings: { $concatArrays: ["$ratings", [rating]] },
          ratings_count: { $add: ["$ratings_count", 1] },
          average_rating: {
            $divide: [
              { $add: [{ $sum: "$ratings" }, rating] },
              { $add: ["$ratings_count", 1] },
            ],
          },
        },
      },
    ]);

    const submitted = await courseProgressOfStudent.save();
    if (!submitted || !courseUpdated) {
      return res.status(400).json({
        message:
          "Something went wrong while review submitting... Please try again.",
      });
    }
    return res.status(200).json({ message: "Thanks for your feedback." });
  } catch (error) {
    console.log("Course Review Updating Error: ", error);
    return res.json({ message: "Internal Server Error" });
  }
};

const getAllCoursesForAdminSide = async (req, res) => {
  try {
    const { search, sort, category, listing_status, page = 1, limit = 12 } = req.query;

    const filters = {};
    if (search) {
      filters.title = { $regex: search, $options: "i" }; 
    }
    if (category && category !== "all") {
      filters.category_id = category;
    }
    if (listing_status && listing_status !== "all") {
      filters.is_listed = listing_status === "listed";
    }

    const sortOptions = {};
    if (sort === "latest") sortOptions.created_at = -1;
    if (sort === "oldest") sortOptions.created_at = 1;
    if (sort === "title_asc") sortOptions.title = 1;
    if (sort === "title_desc") sortOptions.title = -1;
    if (sort === "price_low_to_high") sortOptions.price = 1;
    if (sort === "price_high_to_low") sortOptions.price = -1;

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(filters).sort(sortOptions).skip(skip).limit(parseInt(limit)),
      Course.countDocuments(filters),
    ]);

    return res.status(200).json({ message: "All courses fetched successfully", courses, total });
  } catch (error) {
    console.error("Error fetching courses for admin:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
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
  updateCourseReviews,
  getAllCoursesForAdminSide
};
