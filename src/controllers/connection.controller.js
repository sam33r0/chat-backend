import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Connection } from "../models/connections.model.js";
import mongoose from "mongoose";

const createConnection = asyncHandler(async (req, res) => {
    const { contact } = req.body;
    if (!contact)
        throw new ApiError(401, "contact id not found");
    const contactObjectId = new mongoose.Types.ObjectId(contact);
    const user = req.user;
    const connect = await Connection.findOne({ user: new mongoose.Types.ObjectId(user._id) });
    if (!connect)
        throw new ApiError(401, "Error in finding connetions");
    connect.contacts.push(contactObjectId);
    await connect.save({ validateBeforeSave: false });
    res.status(201).json(new ApiResponse(201, { user, connect }, "contact added successfully"));
})

export { 
    createConnection 
}