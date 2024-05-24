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
    }
}, { timestamps: true })

export const Room= mongoose.model("Room", roomSchema);