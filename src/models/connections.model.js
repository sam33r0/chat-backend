import mongoose, { Schema } from "mongoose";
const connectionsSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    contacts: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, { timestamps: true })

export const Connection = mongoose.model("Connection", connectionsSchema);