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
 const addSkills=TryCatch(async(req:AuthenticatedRequest,res,next)=>{
    const userId=req.user?.user_id;
    const {skillsName}=req.body;
    if(!userId){
        throw new ErrorHandler(401,"Authentication is required");
    }
    if(!skillsName ||skillsName.trim() === ''){
            throw new ErrorHandler(400,"At least one skill is required ");
        }
  let wasSkillAdded=false;
       try {
          await sql `BEGIN`;
          const users=await sql `SELECT * FROM users WHERE uesr_id=${userId }`;
        if(users.length===0){
            throw new ErrorHandler(404,"User not found");
        }
        const [skill]= await sql ` INSERT INTO skills (name) VALUES (${skillsName.trim()}) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING skill_id`;
        const skillId=skill?.skill_id;
        const insertionResult=  await sql `INSERT INTO user_skills (user_id, skill_id) VALUES (${userId}, ${skillId}) ON CONFLICT (user_id, skill_id) DO NOTHING RETURNING user_id`;
           if(insertionResult.length>0){
            wasSkillAdded=true;
           }
            await sql `COMMIT`;
       } catch (error) {
        await sql `ROLLBACK`;
        throw error;
       }
       
       if(!wasSkillAdded){
       return res.status(200).json({
            message:"Skill already exists"
        })
       }
       res.status(201).json({
        message:`Skill ${skillsName.trim()} added successfully`
       })

       
 });

 const  deleteSkill=TryCatch(async(req:AuthenticatedRequest,res,next)=>{
    const userId=req.user?.user_id;
    
    if(!userId){
        throw new ErrorHandler(401,"Authentication is required");
    }
    const {skillname}=req.body;
    if(!skillname || skillname.trim() === ''){
        throw new ErrorHandler(400,"Skill name is required");
    }
    const result = await sql `
      DELETE FROM user_skills
        WHERE user_id = ${userId} AND skill_id =(SELECT skill_id FROM skills WHERE name = ${skillname.trim()}) RETURNING user_id `
        ;
    if(result.length===0){
       throw new ErrorHandler(404,`Skill ${skillname.trim()} not found for the user`);
    }

    res.json({
        message:`Skill ${skillname.trim()} deleted successfully`
    })

 }
);

const applyForJob= TryCatch(async(req:AuthenticatedRequest,res)=>{
      const user=req.user;
       if(!user){
        throw new ErrorHandler(401,"Authentication is required");
       }

        if(user?.role!=='jobseeker'){
            throw new ErrorHandler(403,"Forbidden your are not allowed for this api ");
        }
          const applicant_id=user?.user_id;
          const {job_id}=req.params;
          const resume=user?.resume;
           if(!resume){
            throw new ErrorHandler(400, " you need to add resume in your profile  to apply for this job");
           }
            if(!job_id){
                throw new ErrorHandler(400, " job id is required");

            }

             const  [job]= await sql `  SELECT is_active FROM jobs WHERE job_id=${job_id}`;

              if(!job){
                throw new ErrorHandler (400, " no job with this id");
              }

               if(!job.is_active){
                throw new ErrorHandler(400,'job is not active');
               }

                const now = Date.now();

                 const subTime = req.user?.subscription? new Date(req.user.subscription).getTime():0;

                  const isSubscribed= subTime> now;

                   let newApplication;
                    try {
                        [newApplication] = await sql `INSERT INTO applications (job_id,applicant_id,applicant_email,resume,subscribed) VALUES ( ${job_id}, ${applicant_id} , ${user?.email},${resume},${isSubscribed})`
                    } catch (error:any) {
                        if(error.code === "23505"){
                            throw new ErrorHandler (409, "you have allready applied to this job");
                        }
                        throw error
                    }

                     res.json({
                        message:"applid for job successfully",
                        application:newApplication
                     })




       
})
const getAllapplications = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const applications = await sql`
      SELECT a.*, j.title AS job_title, j.salary AS job_salary, j.location AS job_location
      FROM applications a
      JOIN jobs j ON a.job_id = j.job_id
      WHERE a.applicant_id = ${req.user?.user_id}
    `;

    res.json(applications);
  }
);

export { myProfile, getUserProfile, updateProfile, profilePicUpdate, updateResume, deleteSkill,addSkills,applyForJob,getAllapplications }