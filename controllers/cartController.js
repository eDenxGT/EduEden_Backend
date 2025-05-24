const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

const getCartItemsByUserId = async (req, res) => {
	try {
		const user_id = req.params.user_id;
		const cart = await Cart.aggregate([
			{ $match: { user_id } }, 
			{
			  $lookup: {
				 from: "courses",
				 localField: "courses.course_id",
				 foreignField: "course_id",
				 as: "courses",
			  },
			},
			{
			  $project: {
				 user_id: 1,
				 courses: {
					$filter: {
					  input: "$courses",
					  as: "course",
					  cond: { $eq: ["$$course.is_listed", true] }, 
					},
				 },
			  },
			},
		 ]);
		 
		 console.log(cart);
		 

		return res.status(200).json({ cart: cart[0] });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Error retrieving cart items" });
	}
};

const addCartItem = async (req, res) => {
	try {
		const { course_id, user_id } = req.body;
		let cart = await Cart.findOne({ user_id });
		if (!cart) {
			cart = new Cart({ user_id });
		}

		if (cart.courses.some((course) => course.course_id === course_id)) {
			return res
				.status(400)
				.json({ message: "Course already exists in cart" });
		}

		cart.courses.push({ course_id });
		await cart.save();
		const cartToSent = await Cart.aggregate([
			{ $match: { user_id } },
			{
				$lookup: {
					from: "courses",
					localField: "courses.course_id",
					foreignField: "course_id",
					as: "courses",
				},
			},
		]);

		return res.status(200).json({ cart: cartToSent[0] });
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ message: "Failed to add course to cart" });
	}
};

const removeCartItem = async (req, res) => {
	try {
		const { course_id, student_id } = req.body;
		const cart = await Cart.findOne({ user_id: student_id });

		if (!cart) {
			return res.status(404).json({ message: "Cart not found" });
		}
		cart.courses = cart.courses.filter(
			(course) => course.course_id !== course_id
		);
		await cart.save();

		const cartToSent = await Cart.aggregate([
			{ $match: { user_id:student_id } },
			{
				$lookup: {
					from: "courses",
					localField: "courses.course_id",
					foreignField: "course_id",
					as: "courses",
				},
			},
		]);
		return res.status(200).json({ cart: cartToSent[0] });
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ message: "Failed to remove course from cart" });
	}
};

module.exports = {
	getCartItemsByUserId,
	addCartItem,
	removeCartItem,
};
