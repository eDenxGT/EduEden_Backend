const express = require("express");
const { generateSignature } = require("../controllers/uploadController");

const router = express.Router();

router.post('/generate-sign', generateSignature);



module.exports = router
