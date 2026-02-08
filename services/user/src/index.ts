import express from 'express';
import dotenv from 'dotenv';

dotenv.config();


const app=express();


 app.use(express.json());
 app.get('/',(req,res)=>{
    res.send('User service is running');
 })

import userRoutes from './routes/user.js';

app.use('/api/v1/user',userRoutes);

app.listen(process.env.PORT,()=>{
    console.log(`User service is running on http://localhost:${process.env.PORT}`);
})