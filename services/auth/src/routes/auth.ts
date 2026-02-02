import { Router } from "express";
import uploadFile from "../middleware/multer.js";
import { userRegister } from "../controllers/auth.js";

const router = Router();

 router.route("/register").post(uploadFile,userRegister);

export default router;