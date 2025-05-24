const express = require("express");
const categoryRouter = express.Router();

const {
	getAllCategories,
	searchCategory,
	createCategory,
	deleteCategory,
	updateCategory,
} = require("../controllers/categoryController");

categoryRouter
	.post("/new", createCategory)
	.get("/get-all", getAllCategories)
	.delete("/delete/:id", deleteCategory)
	.get("/search", searchCategory)
	.put("/update/:id", updateCategory);

module.exports = categoryRouter;
