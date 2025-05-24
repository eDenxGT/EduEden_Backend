const Tutor = require("../models/tutorModel");
const Student = require("../models/studentModel");
const Order = require("../models/orderModel");
const Withdrawal = require("../models/withdrawalModel");
const Course = require("../models/courseModel");

const {
  sendTutorAcceptanceEmail,
  sendTutorRejectionEmail,
} = require("../utils/emailUtils");
const FRONTEND_URL = process.env.CLIENT_URL;

const getTutors = async (req, res) => {
  try {
    const { apiFor } = req.query;
    const tutors = await Tutor.find();
    if (apiFor === "ordersList") {
      const tutorsDataToSend = tutors.map((tutor) => ({
        user_id: tutor.user_id,
        full_name: tutor.full_name,
      }));
      return res.status(200).json({ tutors: tutorsDataToSend });
    }
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
    const {
      page = 1,
      limit = 10,
      search = "",
      course,
      tutor,
      priceRange,
      startDate,
      endDate,
    } = req.query;
    const filters = {};

    if (search) {
      filters.$or = [
        { student_name: { $regex: search, $options: "i" } },
        { order_id: { $regex: search, $options: "i" } },
      ];
    }

    if (course) {
      filters["course_details.course_id"] = course;
    }

    if (tutor) {
      filters["course_details.tutor_id"] = tutor;
    }

    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split("-").map(Number);
      filters["amount"] = { $gte: minPrice, $lte: maxPrice || Infinity };
    }

    if (startDate || endDate) {
      filters.created_at = {};
      if (startDate) {
        filters.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filters.created_at.$lte = endOfDay;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

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
        $match: filters,
      },
      {
        $skip: skip,
      },
      {
        $limit: Number(limit),
      },
    ]);

    const totalOrders = await Order.aggregate([
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
        $match: filters,
      },
      {
        $count: "total",
      },
    ]);

    const total = totalOrders[0]?.total || 0;

    return res.status(200).json({
      orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.log("Get All Orders Error: ", error);
    return res.status(500).json({ message: "Error getting all orders" });
  }
};

const getTutorWithdrawals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      amountRange,
      sortOrder = "desc",
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const matchStage = {};

    if (search) {
      matchStage.$or = [
        { "tutorDetails.full_name": { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      matchStage.status = status;
    }

    if (amountRange) {
      const [minAmount, maxAmount] = amountRange.split("-").map(Number);
      matchStage.amount = { $gte: minAmount, $lte: maxAmount };
    }

    const pipeline = [
      {
        $lookup: {
          from: "tutors",
          localField: "tutor_id",
          foreignField: "user_id",
          as: "tutorDetails",
        },
      },

      {
        $unwind: {
          path: "$tutorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      { $match: matchStage },
      {
        $sort: { requested_at: sortDirection },
      },

      {
        $facet: {
          data: [{ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }],
          totalCount: [{ $count: "total" }],
        },
      },
    ];

    const results = await Withdrawal.aggregate(pipeline);

    const withdrawals = results[0]?.data || [];
    const total = results[0]?.totalCount[0]?.total || 0;

    return res.status(200).json({
      withdrawals: withdrawals.map((withdrawal) => ({
        ...withdrawal,
        tutor_name: withdrawal.tutorDetails?.full_name || "Unknown",
      })),
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get Tutor Withdrawals Error: ", error);
    return res.status(500).json({ message: "Error getting tutor withdrawals" });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  try {
    const { request_id, newStatus } = req.body;
    const withdrawal = await Withdrawal.findOne({ _id: request_id });
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }
    let tutor = null;
    withdrawal.status = newStatus;
    console.log(newStatus);
    console.log(withdrawal);
    if (newStatus === "rejected") {
      tutor = await Tutor.findOne({ user_id: withdrawal?.tutor_id });
      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found" });
      }
      console.log(tutor);
      tutor.withdrawn_amount -= Number(withdrawal?.amount);

      console.log(tutor.withdrawn_amount, withdrawal?.amount);
      await tutor.save();
    }
    withdrawal.save();
    return res
      .status(200)
      .json({ message: "Withdrawal status updated successfully" });
  } catch (error) {
    console.error("Update Withdrawal Status Error: ", error);
    return res
      .status(500)
      .json({ message: "Error updating withdrawal status" });
  }
};

const getAdminDashboardData = async (req, res) => {
  try {
    const recentTutors = await Tutor.find({}, "full_name created_at")
      .sort({ created_at: -1 })
      .limit(5);

    const recentStudents = await Student.find({}, "full_name created_at")
      .sort({ created_at: -1 })
      .limit(5);

    const recentCourses = await Course.find({}, "title created_at")
      .sort({ created_at: -1 })
      .limit(5);

    const recentOrders = await Order.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "user_id",
          as: "student",
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $project: {
          studentName: { $arrayElemAt: ["$student.full_name", 0] }, 
          courseTitles: "$courseDetails.title", 
          amount: 1,
          status: 1,
          created_at: 1,
        },
      },
      { $sort: { created_at: -1 } },
      { $limit: 5 },
    ]);

    const totalTutors = await Tutor.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalCourses = await Course.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        recentActivities: {
          tutors: recentTutors,
          students: recentStudents,
          courses: recentCourses,
          orders: recentOrders,
        },
        totalStats: {
          totalTutors,
          totalStudents,
          totalCourses,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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
  getTutorWithdrawals,
  updateWithdrawalStatus,
  getAdminDashboardData,
};
