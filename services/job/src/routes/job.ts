import { Router } from "express";
import { isAuth } from "../middleware/auth.js";
import uploadFile from "../middleware/multer.js";
import { createCompany, createJob, deleteCompany, getAllCompany, updateJob } from "../controllers/job.js";
const router= Router();

 router.route("/company").post(isAuth,uploadFile,createCompany);
 router.route("/company/:companyId").delete(isAuth,deleteCompany);
 router.route('/').post(isAuth,createJob);
 router.route('/:jobId').put(isAuth,updateJob);
 router.route("/company/all").get(isAuth,getAllCompany);




export default  router