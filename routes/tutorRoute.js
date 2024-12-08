const express = require('express')
const tutorRouter = express.Router()

const { verifyTutor } = require("../middlewares/auth");

const { updateTutor } = require('../controllers/tutorController')

tutorRouter.put('/update-profile',verifyTutor, updateTutor)

module.exports = tutorRouter