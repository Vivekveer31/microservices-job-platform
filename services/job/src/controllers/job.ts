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
export {createCompany,deleteCompany}