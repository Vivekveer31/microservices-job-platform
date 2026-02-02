import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import bcrypt from "bcrypt";
import getBuffer from "../utils/buffer.js";
import axios from "axios";


 const  userRegister=TryCatch(async(req,res,next)=>{
    const {name,email,password,phoneNumber,role,bio}=req.body;

    if(!name || !email || !password || !phoneNumber || !role){
      throw new ErrorHandler(400,"All fields are required");
    }

    const user=await   sql `SELECT user_id FROM users WHERE  email=${email} `;
    if(user.length>0){
        throw new ErrorHandler(409,"User already exists with this email");
    }

    const hashedPassword= await bcrypt.hash(password,10);

    let registerUser;
if (role === "employer") {
    const [newUser] = await sql`
        INSERT INTO users (name,email,password,phone_number,role)
        VALUES (${name},${email},${hashedPassword},${phoneNumber},${role})
        RETURNING user_id,name,email,phone_number,role,create_at
    `;
    registerUser = newUser;
} else if (role === "jobseeker") {
    const file = req.file;
    if(!file){
       throw new ErrorHandler(400," Resume file is required for jobseeker");
    }
    const fileBuffer = getBuffer(file);
    if(!fileBuffer || !fileBuffer.content){
       throw new ErrorHandler(500,"Failed to generate buffer");
    }
      const {data}=await axios.post("http://localhost:8001/api/v1/utils/upload",{
        buffer:fileBuffer.content,
      });
    const [newUser] = await sql`
        INSERT INTO users (name,email,password,phone_number,role,bio,resume,resume_public_id)
        VALUES (${name},${email},${hashedPassword},${phoneNumber},${role},${bio},${data.url},${data.public_id})
        RETURNING user_id,name,email,phone_number,role,bio,resume,create_at
    `;
    registerUser = newUser;
}

  if(!registerUser){
    throw new ErrorHandler(500,"Failed to register user");
  }

  res.status(201).json({
    message:"User registered successfully",
    user:registerUser,
  });
  
 })

 export {userRegister};