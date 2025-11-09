import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from "./db/connectDB.js";

// Get the directory name in ES module
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import authRoutes from "./routes/auth.route.js";

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

// CORS configuration - allow both development and production origins
const corsOptions = {
	origin: process.env.CLIENT_URL || "http://localhost:5173",
	credentials: true
};

app.use(cors(corsOptions));

app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies

app.use("/api/auth", authRoutes);

// Only serve frontend static files in production for traditional deployment
// (not when deployed separately to Vercel)
if (process.env.NODE_ENV === "production" && process.env.VERCEL !== '1') {
	// Serve static files from the actual frontend build directory (works from dist/backend)
	app.use(express.static(path.join(__dirname, "../../frontend/dist")));

	app.get("*", (req: Request, res: Response) => {
		res.sendFile(path.resolve(__dirname, "../../frontend/dist/index.html"));
	});
}

// For Vercel serverless deployment, export the app
export default app;

// Only listen when not in serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
	app.listen(PORT, () => {
		connectDB();
		console.log("Server is running on port: ", PORT);
	});
} else {
	// Connect to DB in serverless environment
	connectDB();
}
