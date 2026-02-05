import { Router } from "express";
import uploadFile from "../middleware/multer.js";
import { forgotPassword, resetPassword, userLogin, userRegister } from "../controllers/auth.js";

const router = Router();

 router.route("/register").post(uploadFile,userRegister);
 router.route("/login").post(userLogin);
 router.route("/forgot-password").post(forgotPassword);
  router.route("/reset-password/:token").post(resetPassword);

export default router;