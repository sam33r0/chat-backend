import mongoose, { Schema } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
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

connectionsSchema.pre('save', function(next) {
    const connection = this;
    
    // Check for self-reference
    if (connection.contacts.includes(connection.user)) {
        return next(new ApiError('User cannot add themselves as a contact.'));
    }

    // Check for duplicate contacts
    const uniqueContacts = [...new Set(connection.contacts.map(contact => contact.toString()))];
    if (uniqueContacts.length !== connection.contacts.length) {
        return next(new ApiError(401,'Duplicate contacts are not allowed.'));
    }

    next();
});

export const Connection = mongoose.model("Connection", connectionsSchema);