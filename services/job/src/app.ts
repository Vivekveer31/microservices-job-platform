import express from 'express';


const app = express();

app.use(express.json());

import  jobRoutes from './routes/job.js'

app.use("api/v1/job",jobRoutes)

export default app;