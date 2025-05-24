const Lecture = require("../models/lectureModel");
const Course = require("../models/courseModel");
const Student = require("../models/studentModel");
const Tutor = require("../models/tutorModel");

const addLecture = async (req, res) => {
  const {
    course_id,
    _id,
    title,
    description,
    duration,
    video,
    thumbnail,
    pdf_notes,
  } = req.body;

  try {
    const lecture = new Lecture({
      course_id,
      lecture_id: _id,
      title,
      description,
      duration,
      video,
      video_thumbnail: thumbnail,
      lecture_note: pdf_notes,
    });

    await lecture.save();
    return res.status(200).json({ message: "Lecture added successfully!" });
  } catch (error) {
    console.log("Lecture Adding Error: ", error);
  }
};

const updateLecture = async (req, res) => {
  const { ...updatedData } = req.body;
  const { lecture_id } = req.params;
  try {
    if (Object.keys(updatedData).includes("pdf_notes"))
      updatedData.lecture_note = updatedData.pdf_notes;

    // console.log("LECTURE DETAILS NEW", updatedData, "lecture id", lecture_id);

    const lecture = await Lecture.findOneAndUpdate(
      { lecture_id },
      updatedData,
      { new: true, upsert: true }
    );
    if (lecture) {
      return res
        .status(200)
        .json({ message: "Lecture updated successfully!", lecture });
    }
  } catch (error) {
    console.log("Lecture Updating Error: ", error);
  }
};

const getLecturesByCourseIdForStudent = async (req, res) => {
  const { course_id } = req.params;
  const { user_id } = req.user;

  if (!user_id)
    return res.status(400).json({ message: "Student ID is required." });
  if (!course_id)
    return res.status(400).json({ message: "Course ID is required." });

  try {
    const studentEnrolledThisCourse = await Student.findOne({
      user_id,
      active_courses: { $in: [course_id] },
    });
    if (!studentEnrolledThisCourse)
      return res
        .status(404)
        .json({ message: "You are not enrolled in this course!" });

    const course = await Course.findOne({ course_id });
    if (!course) return res.status(404).json({ message: "Course not found!" });

    const tutor_id = course.tutor_id;
    const tutorDataToSend = await Tutor.findOne({ user_id: tutor_id });
    if (!tutorDataToSend)
      return res.status(404).json({ message: "Tutor not found!" });

    const lectures = await Lecture.find({ course_id });
    lectures.push({ tutor_name: tutorDataToSend?.full_name });
    lectures.push({ tutor_avatar: tutorDataToSend?.avatar });

    if (lectures) {
      return res
        .status(200)
        .json({ message: "Lectures fetched successfully!", lectures });
    }
  } catch (error) {
    console.log("Lecture Fetching Error: ", error);
  }
};

const getLecturesByCourseIdForTutor = async (req, res) => {
  const { course_id } = req.params;
  const { user_id } = req.user;
  try {
    if (!user_id)
      return res.status(400).json({ message: "Tutor ID is required." });
    if (!course_id)
      return res.status(400).json({ message: "Course ID is required." });
    const course = await Course.findOne({
      $and: [{ course_id }, { tutor_id: user_id }],
    });
    if (!course) return res.status(404).json({ message: "Course not found!" });
    const lectures = await Lecture.find({ course_id });
    if (lectures) {
      return res
        .status(200)
        .json({ message: "Lectures fetched successfully!", lectures });
    }
  } catch (error) {
    console.log("Lecture Fetching Error: ", error);
  }
};
// const deleteLecture = async (req, res) => {
// 	const { lecture_id } = req.params;
// 	try {
// 		const lecture = await Lecture.findOneAndDelete({ lecture_id });
// 		if (lecture) {
// 			return res
// 				.status(200)
// 				.json({ message: "Lecture deleted successfully!", lecture });
// 		}
// 	} catch (error) {
// 		console.log("Lecture Deleting Error: ", error);
// 	}
// };

module.exports = {
  addLecture,
  updateLecture,
  getLecturesByCourseIdForStudent,
  getLecturesByCourseIdForTutor
};
