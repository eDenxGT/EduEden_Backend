const Tutor = require("../models/tutorModel");
const Student = require("../models/studentModel");
const Order = require("../models/orderModel");

const {
  sendTutorAcceptanceEmail,
  sendTutorRejectionEmail,
} = require("../utils/emailUtils");
const FRONTEND_URL = process.env.CLIENT_URL;

const getTutors = async (req, res) => {
  try {
    const tutors = await Tutor.find();
    return res.status(200).json({ tutors });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    res.status(500).json({ message: "Error fetching tutors" });
  }
};

const toggleTutorStatus = async (req, res) => {
  try {
    const { tutorId } = req.body;

    const tutor = await Tutor.findOne({ user_id: tutorId });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    tutor.is_blocked = !tutor.is_blocked;

    await tutor.save();
    return res.status(200).json({
      message: `${tutor.full_name} has been successfully ${
        tutor.is_blocked ? "blocked" : "unblocked"
      }.`,
    });
  } catch (error) {
    console.log("Toggle Tutor Status Error: ", error);
    res.status(500).json({ message: "Error toggling tutor status" });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    return res.status(200).json({ students });
  } catch (error) {
    console.log("Students fetching error Admin side:", error);
    res.status(500).json({ message: "Error fetching students" });
  }
};

const toggleStudentStatus = async (req, res) => {
  const { studentId } = req.body;

  try {
    const student = await Student.findOne({ user_id: studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.is_blocked = !student.is_blocked;

    await student.save();

    return res.status(200).json({
      message: `${student.full_name} has been successfully ${
        student.is_blocked ? "blocked" : "unblocked"
      }.`,
    });
  } catch (error) {
    console.log("Toggle Student Status Error: ", error);
    return res.status(500).json({ message: "Error toggling student status" });
  }
};

const searchStudents = async (req, res) => {
  const { query } = req.query;
  try {
    const students = await Student.find({
      $or: [
        { full_name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });
    return res.status(200).json({ students });
  } catch (error) {
    console.log("Search Students Error: ", error);
    return res.status(500).json({ message: "Error searching students" });
  }
};

const searchTutors = async (req, res) => {
  const { query } = req.query;
  try {
    const tutors = await Tutor.find({
      $or: [
        { full_name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });
    return res.status(200).json({ tutors });
  } catch (error) {
    console.log("Search Tutors Error: ", error);
    return res.status(500).json({ message: "Error searching tutors" });
  }
};

const getTutorApplications = async (req, res) => {
  try {
    const applications = await Tutor.find({
      $or: [
        { is_identity_verified: "pending" },
        { is_identity_verified: "rejected" },
      ],
    });
    return res.status(200).json({ applications });
  } catch (error) {
    console.log("Get Tutor Applications Error: ", error);
    return res
      .status(500)
      .json({ message: "Error getting tutor applications" });
  }
};

const updateTutorApplicationStatus = async (req, res) => {
  try {
    const { tutor_id, status } = req.body;
    const tutor = await Tutor.findOne({ user_id: tutor_id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    tutor.is_identity_verified = status;
    await tutor.save();

    if (status === "accept") {
      await sendTutorAcceptanceEmail(
        tutor.email,
        tutor.full_name,
        `${FRONTEND_URL}/tutor/signin`
      );
    } else if (status === "rejected") {
      await sendTutorRejectionEmail(
        tutor.email,
        tutor.full_name,
        `${FRONTEND_URL}/support`
      );
    }

    return res
      .status(200)
      .json({ message: "Tutor application status updated successfully" });
  } catch (error) {
    console.log("Update Tutor Application Status Error: ", error);
    return res
      .status(500)
      .json({ message: "Error updating tutor application status" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "course_id",
          as: "course_details",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "user_id",
          as: "student_details",
        },
      },
      {
        $unwind: {
          path: "$student_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          order_id: 1,
          student_id: 1,
          student_name: "$student_details.full_name",
          amount: 1,
          status: 1,
          created_at: 1,
          course_details: {
            $map: {
              input: "$course_details",
              as: "course",
              in: {
                course_id: "$$course.course_id",
                title: "$$course.title",
                price: "$$course.price",
                tutor_id: "$$course.tutor_id",
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "tutors",
          let: { tutor_ids: "$course_details.tutor_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$user_id", "$$tutor_ids"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                tutor_id: "$user_id",
                tutor_name: "$full_name",
              },
            },
          ],
          as: "tutor_details",
        },
      },
      {
        $project: {
          order_id: 1,
          student_id: 1,
          student_name: 1,
          amount: 1,
          status: 1,
          created_at: 1,
          course_details: {
            $map: {
              input: "$course_details",
              as: "course",
              in: {
                course_id: "$$course.course_id",
                title: "$$course.title",
                price: "$$course.price",
                tutor_id: "$$course.tutor_id",
                tutor_name: {
                  $let: {
                    vars: {
                      tutor: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$tutor_details",
                              cond: {
                                $eq: ["$$this.tutor_id", "$$course.tutor_id"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$tutor.tutor_name",
                  },
                },
              },
            },
          },
        },
      },
    ]);
    console.log(orders);
    return res.status(200).json({ orders });
  } catch (error) {
    console.log("Get All Orders Error: ", error);
    return res.status(500).json({ message: "Error getting all orders" });
  }
};

module.exports = {
  getTutors,
  toggleTutorStatus,
  getStudents,
  toggleStudentStatus,
  searchStudents,
  searchTutors,
  getTutorApplications,
  updateTutorApplicationStatus,
  getAllOrders,
};
