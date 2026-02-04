import type { Producer, Admin } from "kafkajs";
import { Kafka } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

let producer: Producer;
let admin: Admin;

export const connectKafka=async()=>{
    try {
         const kafka=new Kafka({
        clientId: 'auth-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
         });

           
         admin=kafka.admin();

         await admin.connect();
         const topic=await admin.listTopics();

            if(!topic.includes('send-mail')){
                await admin.createTopics({
                    topics:[{
                        topic:'send-mail',  
                        numPartitions:1,
                        replicationFactor:1
                    }]
                });
                console.log("Kafka send-mail  created");

            }
            await admin.disconnect();
            producer=kafka.producer();
            await producer.connect();
            console.log("Kafka Producer connected");

    } catch (error) {
        console.error("Error connecting to Kafka:", error);
    }
}


export const publishToTopic=async(topic:string,message:any)=>{
      if(!producer){
            throw new Error("Kafka producer is not connected");
        }
    try {
      
        await producer.send({
            topic,
            messages: [
                {
                    value: JSON.stringify(message)
                }
            ]
        });
        console.log(`Message published to topic ${topic}`);
    } catch (error) {
        console.error("Error publishing message to Kafka:", error);
    }
}
export const disconnectKafka=async()=>{
    try {
        if(producer){
            await producer.disconnect();
            console.log("Kafka producer disconnected");
        }   
    } catch (error) {
        console.error("Error disconnecting Kafka producer:", error);
    }   
}