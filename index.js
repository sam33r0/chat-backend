import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import {app} from './src/app.js'

connectDB()
.then(()=>{
    app.on("error",
        (error)=>{
            console.log("error",error);
            throw error;
        }
    )
    

})
.catch((error)=>{
    console.log("mongodb connection fail!!! ", error);
});

dotenv.config({
    path: './.env'
})