interface User{
    user_id:string;
    name:string;
    email:string;
    phone_number:string;
    role:"jobseeker" | "recruiter";
    bio:string | null;
    resume:string | null;
    resume_public_id:string | null;
    profile_pic:string | null;
    profile_pic_public_id:string | null;
    skills:string[];
    subscription:string | null;

}
export interface AuthenticatedRequest extends Request{
    user?:User;
}
import type { Request,Response,NextFunction } from "express";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { sql } from "../utils/db.js";

export  const isAuth=async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{

    try {
       const  authHeader=req.headers.authorization;
       if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({message:'Unauthorized request'});
       }
        const taken=authHeader.split(' ')[1];
        if(!taken){
            return res.status(401).json({message:'Unauthorized request'});
        }
        const decoded=jwt.verify(taken,process.env.JWT_SECRET_KEY as string) as JwtPayload;
         if(!decoded || !decoded.id){
            return res.status(401).json({message:'Unauthorized request'});

         }

         const users= await sql `
         SELECT u.user_id,u.email, u.phone_number,u.role,u.bio,u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.skills, u.subscription, 
         ARRAY_AGG(s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL) AS skills 
         FROM users u LEFT JOIN user_skills us ON u.user_id = us.user_id LEFT JOIN skills s ON us.skill_id = s.skill_id
         WHERE u.user_id = ${decoded.id} 
         GROUP BY u.user_id;
         `;
         
         if(users.length===0){
            return res.status(401).json({
                message:"User associated with this token no longer exits",
            })

         }
         const user=users[0] as User;
         user.skills=user.skills || [];

         req.user=user;
         next();
    } catch (error) {
        console.log(error);
        res.status(401).json({message:'Unauthorized request'});
        next(error);
    }
}