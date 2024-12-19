const Student = require("../models/studentModel");
const Tutor = require("../models/tutorModel");
const Order = require("../models/orderModel");
const Course = require("../models/courseModel")

const { comparePassword, hashPassword } = require("../utils/passwordUtils");

const updateStudent = async (req, res) => {
  try {
    const { studentId, currentPassword, newPassword, ...updatedFields } =
      req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (
      updatedFields.user_name &&
      updatedFields.user_name !== student.user_name
    ) {
      const existingStudent = await Student.findOne({
        user_name: updatedFields.user_name,
        _id: { $ne: studentId },
      });
      const existingTutor = await Tutor.findOne({
        user_name: updatedFields.user_name,
      });

      if (existingStudent || existingTutor) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    if (updatedFields.email && updatedFields.email !== student.email) {
      const existingStudent = await Student.findOne({
        email: updatedFields.email,
        _id: { $ne: studentId },
      });
      const existingTutor = await Tutor.findOne({
        email: updatedFields.email,
      });

      if (existingStudent || existingTutor) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    if (updatedFields.phone && updatedFields.phone !== student.phone) {
      const existingStudent = await Student.findOne({
        phone: updatedFields.phone,
        _id: { $ne: studentId },
      });
      const existingTutor = await Tutor.findOne({
        phone: updatedFields.phone,
      });

      if (existingStudent || existingTutor) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    if (currentPassword && typeof student.password === "string") {
      const isPasswordValid = await comparePassword(
        currentPassword,
        student.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid current password" });
      } else if (currentPassword === newPassword) {
        return res.status(400).json({
          message: "New password cannot be the same as the current password",
        });
      }
    }

    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword);
      updatedFields.password = hashedPassword;
    }

    Object.keys(updatedFields).forEach((key) => {
      if (updatedFields[key] !== undefined) {
        student[key] = updatedFields[key];
      }
    });

    await student.save();

    const { password: _, ...studentWithoutPassword } = student.toObject();

    res.status(200).json({
      message: "Profile updated successfully",
      studentData: studentWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStudentDetails = async (req, res) => {
  try {
    const { student_id } = req.params;
    console.log(student_id);
    const student = await Student.findOne({ user_id: student_id });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ student });
  } catch (error) {
    console.error("Error retrieving student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllTutorsForStudents = async (req, res) => {
  try {
    const { apiFor } = req.query;

    const tutors = await Tutor.find({
      $and: [{ is_blocked: false }, { is_identity_verified: "accept" }],
    });
    if (apiFor === "forPurchaseHistory" || apiFor === "forFiltering") {
      const tutorsDataToSend = tutors.map((tutor) => ({
        user_id: tutor.user_id,
        full_name: tutor.full_name,
      }));
      return res.status(200).json({ tutors: tutorsDataToSend });
    }
    res.status(200).json({ tutors });
  } catch (error) {
    console.error("Error retrieving tutors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStudentPurchases = async (req, res) => {
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
      sortOrder = "desc", // Default to "New to Old"
    } = req.query;

    const student_id = req.user.user_id;

    if (!student_id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const filters = { student_id };

    if (search) {
      filters.$or = [
        { student_name: { $regex: search, $options: "i" } },
        { "course_details.title": { $regex: search, $options: "i" } },
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

    const purchases = await Order.aggregate([
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
        $sort: {
          created_at: sortOrder === "asc" ? 1 : -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: Number(limit),
      },
    ]);

    const totalPurchases = await Order.aggregate([
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

    const total = totalPurchases[0]?.total || 0;

    return res.status(200).json({
      purchases,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.log("Get Student Purchases Error: ", error);
    return res.status(500).json({ message: "Error fetching purchases" });
  }
};

const getEnrolledCourses = async (req, res) => {
	try {
	  const { user_id } = req.user;
	  const { search, sort, category, tutor, page = 1, limit = 12 } = req.query;
		console.log(req.query)
	  const student = await Student.findOne({ user_id });
	  if (!student) {
		return res.status(404).json({ message: "Student not found" });
	  }
  
	  if (!student.active_courses || student.active_courses.length === 0) {
		return res.status(200).json({ courses: [] });
	  }
  
	  const query = {
		course_id: { $in: student.active_courses },
		is_listed: true,
	  };
  
	  if (search) {
		query.title = { $regex: search, $options: "i" }; 
	  }
  
	  if (category && category !== 'all') {
		query.category_id = category;
	  }

	  if (tutor && tutor !== 'all') {
		query.tutor_id = tutor;
	  }

  
	  let sortOptions = {};
	  if (sort) {
		switch (sort) {
		  case 'date_newest':
			sortOptions.created_at = -1;
			break;
		  case 'date_oldest':
			sortOptions.created_at = 1;
			break;
		  case 'title_asc':
			sortOptions.title = 1;
			break;
		  case 'title_desc':
			sortOptions.title = -1;
			break;
		  default:
			sortOptions.createdAt = -1;
		}
	  }
  
	  const skip = (page - 1) * limit;
  
	  const coursesEnrolledByStudent = await Course.find(query)
		.sort(sortOptions)
		.skip(skip)
		.limit(Number(limit));
  
	  return res.status(200).json({courses: coursesEnrolledByStudent, total_enrolled_courses: student.active_courses.length}); 
	} catch (error) {
	  console.error("Getting enrolled courses error:", error);
	  return res.status(500).json({ message: "Error fetching enrolled courses" });
	}
  };  

module.exports = {
  updateStudent,
  getStudentDetails,
  getAllTutorsForStudents,
  getStudentPurchases,
  getEnrolledCourses,
};
