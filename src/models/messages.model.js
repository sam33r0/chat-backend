import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    content:{
        type: String,
        required: true
    },
    author:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    room:{
        type: Schema.Types.ObjectId,
        ref: "Room"
    }
},{timestamps: true})

export const Message= mongoose.model("Message",messageSchema);