import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { clerkMiddleware } from "@clerk/express";
import apiRoutes from "./routes";

const app = express();

// Middleware 
// credentials: true allow requests from frontend and send cookies (for auth)
app.use(cors({ origin: ENV.FRONTEND_URL, credentials: true }));
app.use(clerkMiddleware()); // auth obj will be attached to the req
app.use(express.json()); // parses JSON request bodies.
app.use(express.urlencoded({ extended: true })); // parses form data (like HTML forms).

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message:
      "Welcome to Productify API - Powered by PostgreSQL, Drizzle ORM & Clerk Auth",
    endpoints: {
      users: "/api/users",
      products: "/api/products",
      comments: "/api/comments",
    },
  });
});

// API routes
app.use("/api", apiRoutes);

// Start the server
app.listen(ENV.PORT, () =>
  console.log("Server is up and running on PORT:", ENV.PORT)
);
