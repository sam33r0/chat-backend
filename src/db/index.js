import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n Mongo DB connected !! DBHOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("db connection",error);
        process.exit(1)
    }
}
export default connectDB;