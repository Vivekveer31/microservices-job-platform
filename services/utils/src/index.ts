import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from 'cloudinary';
import { startSendMailConsumer } from "./consumer.js";
dotenv.config();
startSendMailConsumer();
cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME || "", 
        api_key: process.env.CLOUDINARY_API_KEY || "", 
        api_secret: process.env.CLOUDINARY_API_SECRET || "" 
    });
   
const app=express();
app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit:'50mb',extended:true}));

import routes from "./routes.js";
app.use("/api/v1/utils",routes);
app.listen(process.env.PORT,()=>{
    console.log(`Utils Service is running on  http://localhost:${process.env.PORT}`);
});