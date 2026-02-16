import type { AuthenticatedRequest } from "../middleware/auth.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import { sql } from "../utils/db.js";
import getBuffer from "../utils/buffer.js";
import axios from "axios";
import { error } from "console";


const createCompany=TryCatch(async(req:AuthenticatedRequest,res)=>{
    const user=req.user

     if(!user){
        throw new ErrorHandler(401,"Authenticatoin Error");
     }

      if(user.role!="recruiter"){
        throw new ErrorHandler(403,"only recruter can create company");
      }

      const {name,description,website}=req.body;
       if(!name || !description || !website){
        throw new ErrorHandler(401," All fileds are required");
       }

       const existingCompany= await sql ` SELECT company_id FROM companies WHERE name=${name}`;

       if(existingCompany.length>0){
          throw new ErrorHandler(409,`Company with the name ${name} already exist`)
       }
       const file = req.file;
       if(!file){
        throw new ErrorHandler(400, "company logo is required");
       }

       const  fileBuffer= getBuffer(file);

        if(!fileBuffer || ! fileBuffer.content){
             throw new ErrorHandler(500,"Error  while generating fileBuffer");
        }
         const {data} = await axios.post("http://localhost:8001/api/v1/utils/upload",{
            buffer:fileBuffer.content
         })

         const [newCompany] = await sql `INSERT INTO companies (name,description,logo,logo_public_id,recruiter_id) VALUES (${name},${description},${data.url},${data.public_id}, ${req.user?.user_id}) RETURNING *`

         res.json({
            message:"Company created successfully",
            company:newCompany
         })
})

const deleteCompany = TryCatch(async(req:AuthenticatedRequest,res)=>{
    const user=req.user;

    const {companyId}=req.params;

     if(!user){
      throw new  ErrorHandler(401,"Authentication  is reqiured");
     }

     const [company]= await sql `SELECT logo_public_id FROM companies WHERE company_id=${companyId} AND recruiter_id=${user?.user_id}`;

     if(!company){
      throw new ErrorHandler(404,"Company not found or your not autherized to delete it");
     }

     await sql `DELETE FROM companies WHERE company_id=${companyId}`;
     res.json({
      message:"company and associated jobs been deleted"
     })
})

const createJob = TryCatch(async(req:AuthenticatedRequest,res)=>{
     const user=req.user

     if(!user){
        throw new ErrorHandler(401,"Authenticatoin Error");
     }

      if(user.role!="recruiter"){
        throw new ErrorHandler(403,"only recruter can create company");
      }
      const {title,description,salary,role,location,job_type,work_location,company_id,openings}=req.body;
       if(!title || !description || !salary || !role || !location || !job_type  || !work_location ||  !company_id || !openings ){
          throw new ErrorHandler(401," All fields are required");

       }

       const [company] = await sql ` SELECT company_id  FROM companies WHERE company_id=${company_id} AND recruiter_id = ${user.user_id}`;

        if(!company){
         throw new ErrorHandler(404, "company not found");
        }

        const [ newJob] = await sql `INSERT INTO jobs (title,description,salary,role,location,job_type,work_location,company_id,openings) VALUES (${title},${description},${salary},${role},${location},${job_type},${work_location},${company_id},${openings}) RETURNING *`;

        res.json({
         message:"Job created successfully",
         job:newJob
        })
     

})

const updateJob= TryCatch(async(req:AuthenticatedRequest,res)=>{
     const user=req.user

     if(!user){
        throw new ErrorHandler(401,"Authenticatoin Error");
     }

      if(user.role!="recruiter"){
        throw new ErrorHandler(403,"only recruter can create company");
      }
      const {title,description,salary,role,location,job_type,work_location,company_id,openings,is_active}=req.body;
       if(!title || !description || !salary || !role || !location || !job_type  || !work_location ||  !company_id || !openings ){
          throw new ErrorHandler(401," All fields are required");

       }
       const {jobId}=req.params;

       const [existingJob] = await sql ` SELECT podted_by_recruiter_id FROM jobs WHERE job_id=${jobId} `;

        if(!existingJob){
         throw new ErrorHandler(404, "job not found  found");
        }

         if(existingJob.podted_by_recruiter_id!== user.user_id){
             throw new ErrorHandler(403,"Forbidden:You are not allowed");
         }


          const [updatedJob] = await sql `UPDATE jobs SET title = ${title},
          description = ${description},
          location = ${location},
          role = ${role},
          job_type =${job_type}
          work_location=${work_location},
          openings=${openings},
          is_active=${is_active}
          WHERE job_id = ${jobId} RETURINING *`;


          res.json({
            message:"job Updated Successfully",
            job:updateJob
          })



        
})


const getAllCompany= TryCatch(async(req:AuthenticatedRequest,res)=>{

     const user=req.user;

      const companies= await sql `SELECT * FROM  companies WHERE recruiter_id=${user?.user_id}`;

      res.json(companies);
})
  const getCompanyDetails = TryCatch(async(req:AuthenticatedRequest,res)=>{
    const  {id}=req.params;

     if(!id){
      throw new ErrorHandler(400,"Company id is required");
     }

     const [companyData] = await sql`
SELECT c.*, 
COALESCE (
  (
    SELECT json_agg(j.*) 
    FROM jobs j 
    WHERE j.company_id = c.company_id
  ),
  '[]'::json
) AS jobs
FROM companies c 
WHERE c.company_id = ${id} 
GROUP BY c.company_id;
`;
res.json(companyData);

  })

  const getAllActiveJobs= TryCatch(async(req:AuthenticatedRequest,res)=>{

    const { title, location } = req.query as {
  title?: string;
  location?: string;
};

let queryString = `SELECT j.job_id, j.title, j.description, j.salary, j.location, j.job_type, j.role, j.work_location, j.created_at, c.name AS company_name, c.logo AS company_logo, c.company_id AS company_id FROM jobs j JOIN companies c ON j.company_id = c.company_id WHERE j.is_active = true`;

const values=[];
let paramIndex =1;

 if(title){
   queryString+= `AND j.title ILIKE $${paramIndex}`;
   values.push(`%${title}%`);
   paramIndex++;
 }
  if(location){
   queryString+= `AND j.title ILIKE $${paramIndex}`;
   values.push(`%${location}%`);
   paramIndex++;
 }
 queryString+= "ORDER BY j.created_at DESC";

  const jobs =( await sql.query(queryString,values)) as any[];

  res.json(jobs);

  })
export {createCompany,deleteCompany,createJob ,updateJob,getAllCompany,getCompanyDetails}