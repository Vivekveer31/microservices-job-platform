import type { Request, Response, NextFunction, RequestHandler } from "express";

import ErrorHandler from "./errorHandler.js";

export const TryCatch=(controller:(req:Request,res:Response,next:NextFunction)=>Promise<any>):RequestHandler=> async(req,res,next)=>{
    try {
        await controller(req,res,next);
    } catch (error: any) {
         // for custom messages
         if(error instanceof ErrorHandler){
             return res.status(error.statusCode).json({
                message:error.message,
             })
            }
             

        //this is when defaild  error messege
        res.status(500).json({
            message:error.message,

        });
    }
}