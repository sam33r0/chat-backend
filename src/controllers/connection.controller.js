import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Connection } from "../models/connections.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const getUserConnectionsWithDetails = async (userId) => {
    try {
        const results = await Connection.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'contacts',
                    foreignField: '_id',
                    as: 'contactDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    contacts: {
                        $map: {
                            input: '$contactDetails',
                            as: 'contact',
                            in: {
                                fullName: '$$contact.fullName',
                                avatar: '$$contact.avatar'
                            }
                        }
                    }
                }
            }
        ]);

        return results;
    } catch (error) {
        console.error('Error in aggregation pipeline:', error);
        throw error;
    }
};

const createConnection = asyncHandler(async (req, res) => {
    const { email } = req.body;
    console.log('hihi',email);
    if (!email)
        throw new ApiError(401, "contact id not found");
    const user = req.user;
    const userIDobj = new mongoose.Types.ObjectId(user._id)
    const connect = await Connection.findOne({ user: userIDobj });
    if (!connect)
        throw new ApiError(401, "Error in finding connetions");

    const contact = await User.findOne(
        { email }
    )
    if (!contact)
        throw new ApiError("unable to find user");
    const contactObjectId = new mongoose.Types.ObjectId(contact?._id);
    const connectOfContact = await Connection.findOne(
        { 
            user: contactObjectId
        }
    );
   
    connectOfContact.contacts.push(userIDobj);
    connect.contacts.push(contactObjectId);
    await connectOfContact.save({ validateBeforeSave: false })
    await connect.save({ validateBeforeSave: false });
    res.status(201).json(new ApiResponse(201, { user, connect }, "contact added successfully"));
})

const getConnections = asyncHandler(async (req, res) => {
    const user = req.user;
    const connections = await getUserConnectionsWithDetails(user._id);
    if (!connections)
        throw new ApiError(401, "Unable to find connections");
    return res.status(201).json(new ApiResponse(201, { user, connections }, "Contacts found"));
})

export {
    createConnection,
    getConnections
}