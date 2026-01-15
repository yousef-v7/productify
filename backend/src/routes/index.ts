import { Router } from "express";
import userRoutes from "./userRoutes";
import productRoutes from "./productRoutes";
import commentRoutes from "./commentRoutes";

const router = Router();

router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/comments", commentRoutes);

export default router;
