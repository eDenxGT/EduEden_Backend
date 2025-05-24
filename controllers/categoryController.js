const Category = require("../models/categoryModel");

const createCategory = async (req, res) => {
  const { title, description } = req.body;
  try {
    const existingCategory = await Category.findOne({
      title: { $regex: `^${title}`, $options: "i" },
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }
    const addNewCategory = new Category({
      title,
      description,
    });
    await addNewCategory.save();
    return res.status(201).json({
      message: "Category created successfully",
      category: addNewCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
    console.log("Create Category error : ", error);
  }
};

const getAllCategories = async (req, res) => {
  try {
    // console.log("CATEGORIES FETCHING");
    const { apiFor } = req.query;
    const categories = await Category.find();
    if (apiFor === "forFiltering") {
      const categoriesDataToSent = categories.map((category) => ({
        category_id: category._id,
        title: category.title,
      }));
      return res
        .status(200)
        .json({
          message: "Category Fetching Completed",
          categories: categoriesDataToSent,
        });
    }
    return res
      .status(200)
      .json({ message: "Category Fetching Completed", categories });
  } catch (error) {
    console.log("Get All Categories error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    const deletedCoursesOfDeletedCategory = await Course.deleteMany({category_id: id})
    return res
      .status(200)
      .json({ message: "Category deleted successfully", categoryId: id });
  } catch (error) {
    console.log("Delete Category error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const searchCategory = async (req, res) => {
  try {
    // console.log(req.query);

    const { query } = req.query;
    const categories = await Category.find({
      title: { $regex: query, $options: "i" },
    });
    if (!categories.length) {
      return res
        .status(200)
        .json({ message: "No categories found", categories: [] });
    }
    console.log(categories);

    return res.status(200).json({ message: "Category found", categories });
  } catch (error) {
    console.log("Search Category error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const isCategoryNameExists = await Category.findOne({
      title: { $regex: title, $options: "i" },
    });
    if (isCategoryNameExists) {
      return res.status(400).json({ message: "Category already exists" });
    }
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.log("Update Category error : ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = {
  createCategory,
  getAllCategories,
  searchCategory,
  deleteCategory,
  updateCategory,
};
