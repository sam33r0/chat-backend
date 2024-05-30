import mongoose, { Schema } from "mongoose";

const directMessageSchema = new Schema({
    content:{
        type: String,
        required: true
    },
    author:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    reciever:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps: true})

export const DirectMessage= mongoose.model("DirectMessage",directMessageSchema);