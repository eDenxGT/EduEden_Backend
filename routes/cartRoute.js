const express = require("express");
const cartRouter = express.Router();

const {
	getCartItemsByUserId,
	addCartItem,
	removeCartItem,
} = require("../controllers/cartController");

cartRouter
	.get("/get-items/:user_id", getCartItemsByUserId)
	.post("/add-item", addCartItem)
	.put("/remove-item", removeCartItem)

module.exports = cartRouter;
