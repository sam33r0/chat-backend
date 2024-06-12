import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { app } from './src/app.js'
import { Server } from "socket.io";

dotenv.config({
    path: './.env'
})

connectDB()
    .then(async () => {
        app.on("error",
            (error) => {
                console.log("error", error);
                throw error;
            }
        )

        const servr = app.listen(process.env.PORT || 8000, () => {
            console.log("server listening at port ", process.env.PORT);
        })
        const io = new Server(servr, {
            pingTimeout: 60000,
            cors: {
                origin: process.env.CORS_ORIGIN,
            }
        })

        io.on("connection", (socket) => {
            socket.on('setup', (userdata) => {
                if (userdata._id)
                    socket.join(userdata._id);
                socket.emit("connected");
            })

            socket.on('join-room-chat', (roomId) => {
                socket.join(roomId);
            })
            socket.on('new-room-message', (newMessageRecieved) => {
                let chat = newMessageRecieved?.currentRoom;
                let res = newMessageRecieved?.res;
                let author = newMessageRecieved?.author;
                if (!res) {
                    return console.log("res not found");
                }
                if (!chat)
                    return console.log("current room not found");
                chat.members.forEach((e) => {
                    if (e == author._id) {
                        return;
                    }
                    socket.in(e).emit('new-room-messages-arrived', { mess: res, author, currentRoom: chat._id, roomTitle: chat.title });
                })
            })
            socket.on('join-direct-chat', (chatId) => {
                socket.join(chatId._id);
            })
            socket.on('new-direct-message', (newMessageRecieved) => {
                let reciever = newMessageRecieved.reciever;
                let sender = newMessageRecieved.sender;
                let response = newMessageRecieved.response;
                socket.in(reciever._id).emit('direct-message-arrived', {
                    _id: response._id,
                    content: response.content,
                    createdAt: response.createdAt,
                    sender, reciever
                })
            })
        })

    })
    .catch((error) => {
        console.log("mongodb connection fail!!! ", error);
    });
