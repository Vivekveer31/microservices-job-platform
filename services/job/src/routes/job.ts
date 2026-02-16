import { Router } from "express";
import { isAuth } from "../middleware/auth.js";
import uploadFile from "../middleware/multer.js";
import { createCompany, createJob, deleteCompany, getAllActiveJobs, getAllCompany, getCompanyDetails, getSingleJob, updateJob } from "../controllers/job.js";
const router= Router();

 router.route("/company").post(isAuth,uploadFile,createCompany);
 router.route("/company/:companyId").delete(isAuth,deleteCompany);
 router.route('/').post(isAuth,createJob);
 router.route('/:jobId').put(isAuth,updateJob);
 router.route("/company/all").get(isAuth,getAllCompany);
 router.route("/company/:id").get(isAuth,getCompanyDetails);
 router.route("/all").get(getAllActiveJobs);
 router.route("/jobId").get(getSingleJob);




export default  router