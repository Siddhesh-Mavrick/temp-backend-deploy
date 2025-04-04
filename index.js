import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { connectDB } from "./utils/db.js"
import userRoute from "./route/user.route.js"
import classRoutes from "./route/class.route.js";
import githubRoutes from "./route/github.route.js"
import leetcodeRoutes from "./route/leetcode.route.js"
import assignmentRoutes from "./route/assignmentRoutes.js"
import metricsRoutes from "./routes/metrics.route.js";
import teacherRoutes from "./route/teacher.route.js";
dotenv.config()

const app = express()

// Middelwares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));


const port = process.env.PORT || 6900

app.get("/", (req, res) => {
    res.send("Hello World!")
});

// ---- APIS -------
app.use("/api/v1/user", userRoute)
// Use class routes
app.use('/api/v1/class', classRoutes);
// Github Routes
app.use('/api/v1/', githubRoutes );
// Leetcode Routes
app.use('/api/v1/' , leetcodeRoutes)
// Assignment Routes
app.use('/api/v1/assignment', assignmentRoutes)

// Metrics Routes
app.use('/api/v1/metrics', metricsRoutes);
// Teacher Routes
app.use('/api/v1/teacher', teacherRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    connectDB()
    console.log(`Server is running on ${port}`);
})