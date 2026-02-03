import { Router } from "express";
import uploadFile from "../middleware/multer.js";
import { userLogin, userRegister } from "../controllers/auth.js";

const router = Router();

 router.route("/register").post(uploadFile,userRegister);
 router.route("/login").post(userLogin);

export default router;