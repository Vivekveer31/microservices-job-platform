import { TryCatch } from "../utils/TryCatch.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import getBuffer from "../utils/buffer.js";
import axios from "axios";
const myProfile=TryCatch(async(req:AuthenticatedRequest,res,next)=>{
    const user=req.user;

    res.json({
        user
    })
})

const getUserProfile=TryCatch(async(req,res,next)=>{
   const {userId}=req.params

    const users= await sql `
            SELECT u.user_id,u.email, u.phone_number,u.role,u.bio,u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.skills, u.subscription, 
            ARRAY_AGG(s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL) AS skills 
            FROM users u LEFT JOIN user_skills us ON u.user_id = us.user_id LEFT JOIN skills s ON us.skill_id = s.skill_id
            WHERE u.user_id = ${userId} 
            GROUP BY u.user_id;
            `;
            if(users.length===0){
              throw new ErrorHandler(404,"User not found");
            }
            const user=users[0];
            user.skills=user?.skills || [];
            res.json({
                user
            })
})

const updateProfile=TryCatch(async(req:AuthenticatedRequest,res,next)=>{
    const user=req.user;
    if(!user){
        throw new ErrorHandler(401,"Authentication required");
    }
    const {name,phoneNumber,bio}=req.body;
    const newName=name || user.name;
    const newPhoneNumber=phoneNumber || user.phone_number;
    const newBio=bio || user.bio;
    const [updatedUser]=await sql`
       UPDATE users SET name=${newName} , phone_number = ${newPhoneNumber} , bio = ${newBio} WHERE user_id = ${user.user_id} 
       RETURNING  user_id, name, email,phone_number,bio    
    `;
    res.json({
        message:"Profile updated successfully",
        updatedUser
    })

})

const profilePicUpdate=TryCatch(async(req:AuthenticatedRequest,res,next)=>{
     const user=req.user;
     if(!user){
        throw new ErrorHandler(401,"Authentication is required");
        
     }

     const file=req.file;
      if(!file){
        throw new ErrorHandler(400,"Profile picture file is required");

      }

      const fileBuffer=getBuffer(file);

      if(!fileBuffer || !fileBuffer.content){
        throw new ErrorHandler(400,"failed to process the profile picture file");
      }
       const oldProfilePicPublicId=user.profile_pic_public_id;

       const {data:uploadResult}=await axios.post(`${process.env.UPLOAD_SERVICE_URL}/api/v1/utils/upload`,{
        buffer:fileBuffer.content,
        public_id:oldProfilePicPublicId,
       });

       const [updatedUser]=await sql`
          UPDATE users SET profile_pic=${uploadResult.url} , profile_pic_public_id=${uploadResult.public_id}
          WHERE user_id=${user.user_id}
          RETURNING user_id, name, email, phone_number, profile_pic, profile_pic_public_id
       `;

       res.json({
        message:"Profile picture updated successfully",
        updatedUser
       })
})
const updateResume=TryCatch(async(req:AuthenticatedRequest,res,next)=>{
     const user=req.user;
     if(!user){
        throw new ErrorHandler(401,"Authentication is required");
        
     }

     const file=req.file;
      if(!file){
        throw new ErrorHandler(400,"Resume pdf file is required");

      }

      const fileBuffer=getBuffer(file);

      if(!fileBuffer || !fileBuffer.content){
        throw new ErrorHandler(400,"failed to process the  pdf file");
      }
       const oldResumePublicId=user.resume_public_id;

       const {data:uploadResult}=await axios.post(`${process.env.UPLOAD_SERVICE_URL}/api/v1/utils/upload`,{
        buffer:fileBuffer.content,
        public_id:oldResumePublicId,
       });

       const [updatedUser]=await sql`
          UPDATE users SET resume=${uploadResult.url} , resume_public_id=${uploadResult.public_id}
          WHERE user_id=${user.user_id}
          RETURNING user_id, name, email, phone_number, resume, resume_public_id
       `;

       res.json({
        message:"Resume updated successfully",
        updatedUser
       })
})
export { myProfile, getUserProfile, updateProfile, profilePicUpdate, updateResume }