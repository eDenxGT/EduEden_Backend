const crypto = require("crypto");
const { razorpayInstance } = require("../config/payment");
const Order = require("../models/orderModel");
const Student = require("../models/studentModel");
const Cart = require("../models/cartModel");
const Lecture = require("../models/lectureModel");
const Course = require("../models/courseModel");
const CourseProgress = require("../models/courseProgressModel");
const Tutor = require("../models/tutorModel");
const STATUS_CODE  = require("../constants/statusCode");

const createOrder = async (req, res) => {
  const { amount, ...rest } = req.body;

  const isCourseAvailable = await Course.find({
    $and: [
      { course_id: { $in: rest.courses.map((course) => course.course_id) } },
      { is_listed: true },
    ],
  });
  if (!isCourseAvailable.length) {
    return res
      .status(STATUS_CODE.BAD_REQUEST)
      .json({ message: `Course not available at the moment` });
  }
  if (isCourseAvailable.length !== rest.courses.length) {
    return res
      .status(STATUS_CODE.BAD_REQUEST)
      .json({ message: `Some of the courses are not available` });
  }

  const isCourseAlreadyEnrolled = await Student.findOne({
    user_id: rest.student_id,
    active_courses: { $in: rest.courses.map((course) => course.course_id) },
  });
  if (isCourseAlreadyEnrolled) {
    return res
      .status(STATUS_CODE.BAD_REQUEST)
      .json({ message: `You are already enrolled in this course` });
  }

  const options = {
    amount,
    currency: "INR",
    receipt: `order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    const newOrder = new Order({
      order_id: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      receipt: order.receipt,
      student_id: rest.student_id,
      courses: rest.courses.map((course) => course.course_id),
    });

    await newOrder.save();
    res.status(STATUS_CODE.OK).json(order);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  try {
    const secret = process.env.RAZORPAY_SECRET_KEY;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const order = await Order.findOne({ order_id: razorpay_order_id });
      if (!order) {
        throw new Error("Order not found");
      }

      order.payment_id = razorpay_payment_id;
      order.status = "success";
      const orderSaved = await order.save();
      if (!orderSaved) {
        throw new Error("Order Saving Error");
      }

      const studentUpdated = await Student.updateOne(
        { user_id: order.student_id },
        {
          $addToSet: { active_courses: { $each: order.courses } },
        }
      );
      if (!studentUpdated) {
        throw new Error("Student Updating Error");
      }

      const coruseUpdated = updateEnrollmentCounts(order?.courses);

      if (!coruseUpdated) {
        throw new Error("Course Updating Error");
      }

      const lectures = await Lecture.find({
        course_id: { $in: order.courses },
      });

      const progressDocs = order.courses.map((courseId) => {
        const courseLectures = lectures.filter(
          (lecture) => String(lecture.course_id) === String(courseId)
        );

        const progressArray = courseLectures.map((lecture) => ({
          lecture_id: lecture.lecture_id,
          status: "not-started",
        }));
        return {
          student_id: order.student_id,
          course_id: courseId,
          progress: progressArray,
          overall_progress: 0,
          enrollment_date: new Date(),
        };
      });

      const courseProgressUpdated = await CourseProgress.insertMany(
        progressDocs
      );
      if (!courseProgressUpdated || courseProgressUpdated.length === 0) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Course Progress not updated" });
      }
      await Cart.updateMany(
        { user_id: order.student_id },
        { $pull: { courses: { course_id: { $in: order.courses } } } }
      );

      try {
        const tutorRevenues = await Course.aggregate([
          {
            $match: {
              course_id: { $in: order.courses },
            },
          },
          {
            $group: {
              _id: "$tutor_id",
              totalRevenue: { $sum: "$price" },
            },
          },
        ]);
        console.log(tutorRevenues);

        if (!tutorRevenues || tutorRevenues.length === 0) {
          console.log("No tutors found for the given order.");
          return;
        }

        const bulkOperations = tutorRevenues.map(({ _id, totalRevenue }) => ({
          updateOne: {
            filter: { user_id: _id },
            update: { $inc: { total_revenue: totalRevenue } },
          },
        }));

        await Tutor.bulkWrite(bulkOperations);

        console.log("Tutor revenues updated successfully.");
      } catch (error) {
        console.error("Error updating tutor revenues :", error);
      }

      res.status(STATUS_CODE.OK).json({
        success: true,
        message: "Payment verified and courses enrolled successfully",
      });
    } else {
      res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

const updateEnrollmentCounts = async (courseIds) => {
  try {
    const result = await Course.updateMany(
      { course_id: { $in: courseIds } },
      { $inc: { enrolled_count: 1 } }
    );

    console.log("Courses updated:", result.modifiedCount);
    return result;
  } catch (error) {
    console.error("Error updating enrollment counts:", error);
    throw error;
  }
};

const updateOrderStatus = async (req, res) => {
  const { order_id, status } = req.body;
  console.log(req.body);
  try {
    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Order not found" });
    }
    order.status = status;
    await order.save();
    return res
      .status(STATUS_CODE.OK)
      .json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  updateOrderStatus,
};
