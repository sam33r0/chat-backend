import mongoose, { Schema } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const contactSchema = new Schema({
    contact: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    update: {
        type: String
    }
}, { timestamps: true })
const connectionsSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    contacts:
    {
        type: [contactSchema]
    }

}, { timestamps: true })

connectionsSchema.pre('save', function (next) {
    const connection = this;

    // Check for self-reference
    if (connection.contacts.some(contactObj => contactObj.contact.equals(connection.user))) {
        return next(new ApiError('User cannot add themselves as a contact.'));
    }

    // Check for duplicate contacts
    const contactIds = connection.contacts.map(contactObj => contactObj.contact.toString());
    const uniqueContactIds = [...new Set(contactIds)];

    if (uniqueContactIds.length !== contactIds.length) {
        return next(new ApiError(401, 'Duplicate contacts are not allowed.'));
    }

    next();
});


export const Connection = mongoose.model("Connection", connectionsSchema);