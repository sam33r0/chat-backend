import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import {app} from './src/app.js'
import { Server } from "socket.io";

dotenv.config({
    path: './.env'
})

connectDB()
.then(async()=>{
    app.on("error",
        (error)=>{
            console.log("error",error);
            throw error;
        }
    )
        
    const servr= app.listen(process.env.PORT || 8000,()=>{
        console.log("server listening at port ", process.env.PORT);
    })
    const io=new Server(servr, {
        pingTimeout: 60000,
        cors: {
            origin: "http://localhost:5173",
        }
    })
    io.on("connection",(socket)=>{
        console.log("connected to socekt io", socket.id);
        socket.on('setup',(userdata)=>{
            socket.join(userdata._id);
        })
    })

})
.catch((error)=>{
    console.log("mongodb connection fail!!! ", error);
});
