import express from "express";

 const app = express();
 app.use(express.json());
 app.get("/", (req, res) => {
   res.send('<h1>Auth Service is running</h1>');
 });

 connectKafka();
 import authRoutes from "./routes/auth.js";
import { connectKafka } from "./producer.js";
 app.use("/api/v1/auth",authRoutes)

  export default app;