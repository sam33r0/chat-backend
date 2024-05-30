import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    visibility: {
        type: Boolean,
        required: true,
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, { timestamps: true })

export const Room = mongoose.model("Room", roomSchema);