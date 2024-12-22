// *===== Import Modules ====== *//
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const chalk = require("chalk");
const session = require("express-session");
const nocache = require("nocache");
const cookieParser = require("cookie-parser");
const fs = require('fs');
const https = require('https');

// *===== Initializing Server ====== *//
const app = express();
// const server = require("http").Server(app);
const server = https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/edengt.in/privkey.pem'),  
	cert: fs.readFileSync('/etc/letsencrypt/live/edengt.in/fullchain.pem') 
  }, app);

// *===== Initialize Socket ====== *//
const { initializeSocket } = require("./socket/socketEvents");
initializeSocket(server);

// *====== Import Cron Jobs ====== *//
const cleanUpExpiredTokens = require("./cron/cleanUpExpiredTokens");
const cleanUpExpiredOtps = require("./cron/cleanUpExpiredOtps");

dotenv.config();

// *===== Import Required Routes ====== *//
const authRouter = require("./routes/authRoute");
const adminRouter = require("./routes/adminRoute");
const tutorRouter = require("./routes/tutorRoute");
const studentRouter = require("./routes/studentRoute");
const uploadRouter = require("./routes/uploadRoute");
const categoryRouter = require("./routes/categoryRoute");
const courseRouter = require("./routes/courseRoute");
const lectureRouter = require("./routes/lectureRoute");
const wishlistRouter = require("./routes/wishlistRoute");
const cartRouter = require("./routes/cartRoute");
const paymentRouter = require("./routes/paymentRoute");
const quizRouter = require("./routes/quizRoute");
const chatRouter = require("./routes/chatRoute");

// *===== Middleware ====== *//
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);
app.use(
	session({
		secret: process.env.JWT_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

// *===== Setup Routes ====== *//
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/tutor", tutorRouter);
app.use("/student", studentRouter);
app.use("/categories", categoryRouter);
app.use("/courses", courseRouter);
app.use("/lectures", lectureRouter);
app.use("/cart", cartRouter);
app.use("/wishlist", wishlistRouter);
app.use("/quizzes", quizRouter);
app.use("/chats", chatRouter);

app.use("/api/upload", uploadRouter);
app.use("/payment", paymentRouter);

// *===== Connect to MongoDB ====== *//
mongoose
	.connect(process.env.MONGO_URI)
	.then(async() => {
		console.log(
			chalk.yellowBright.bold(
				"\t|              " +
					chalk.greenBright.bold("Connected to MongoDB😊") +
					"                 |"
			)
		);
		console.log(
			chalk.yellowBright.bold(
				`\t|                                                     |`
			)
		);
		console.log(
			chalk.yellowBright.bold(
				`\t-------------------------------------------------------`
			)
		);
	})
	.catch((err) => {
		const errorMessage = chalk.redBright.bold(
			"MongoDB connection error: " + err
		);
		console.log(errorMessage);
	});

// *===== SERVER STARTUP ====== *//
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(
		chalk.yellowBright.bold(
			`\n\t-------------------------------------------------------`
		)
	);
	console.log(
		chalk.yellowBright.bold(
			`\t|                                                     |`
		)
	);
	console.log(
		chalk.yellowBright.bold(
			`\t|        🌐 Server is running on Port =>` +
				chalk.cyanBright.bold(` ${PORT}`) +
				`         |`
		)
	);
});
