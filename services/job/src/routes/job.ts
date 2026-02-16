import { Router } from "express";
import { isAuth } from "../middleware/auth.js";
import uploadFile from "../middleware/multer.js";
import { createCompany, createJob, deleteCompany } from "../controllers/job.js";
const router= Router();

 router.route("/company").post(isAuth,uploadFile,createCompany);
 router.route("/company/:companyId").delete(isAuth,deleteCompany);
 router.route('/').post(isAuth,createJob);




export default  router