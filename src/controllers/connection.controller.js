import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Connection } from "../models/connections.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Room } from "../models/room.model.js";

const getUserConnectionsWithDetails = async (userId) => {
    try {
        const results = await Connection.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(userId) }
            },
            {
                $unwind: "$contacts"
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'contacts.contact',
                    foreignField: '_id',
                    as: 'contactDetails'
                }
            },
            {
                $unwind: "$contactDetails"
            },
            {
                $group: {
                    _id: "$_id",
                    user: { $first: "$user" },
                    contacts: {
                        $push: {
                            _id: "$contactDetails._id",
                            contact: "$contacts.contact",
                            update: "$contacts.update",
                            fullName: "$contactDetails.fullName",
                            avatar: "$contactDetails.avatar",
                            updatedAt: "$contacts.updatedAt"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    contacts: {
                        $sortArray: {
                            input: "$contacts",
                            sortBy: { updatedAt: -1 }
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

const getRoomsForUser = async (userId) => {
    try {
        const results = await Room.aggregate([
            {
                $match: {
                    members: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: '_id',
                    as: 'memberDetails'
                }
            },
            {
                $unwind: "$memberDetails"
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    avatar: {$first: "$avatar"},
                    update: { $first: "$update" },
                    members: { $first: "$members" },
                    memberDetails: { $push: "$memberDetails" },
                    updatedAt: { $first: "$updatedAt" }
                }
            },
            {
                $sort: {
                    updatedAt: -1
                }
            },
            {
                $project: {
                    title: 1,
                    update: 1,
                    members: 1,
                    avatar: 1,
                    memberDetails: {
                        _id: 1,
                        fullName: 1,
                        email: 1,
                        avatar: 1
                    },
                    updatedAt: 1
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
    if (!email) throw new ApiError(401, "Contact email not found");

    const user = req.user;
    const userIDobj = new mongoose.Types.ObjectId(user._id);

    let connect = await Connection.findOne({ user: userIDobj });
    if (!connect) throw new ApiError(401, "Error in finding connections");

    const contact = await User.findOne({ email });
    if (!contact) throw new ApiError(404, "Unable to find user");

    const contactObjectId = new mongoose.Types.ObjectId(contact._id);
    
    // Check if contact is already in the user's connections
    if (connect.contacts.some(c => c.contact.equals(contactObjectId))) {
        throw new ApiError(400, "Contact already exists");
    }

    // Add user to contact's connections if not present
    let connectOfContact = await Connection.findOne({ user: contactObjectId });
    if (!connectOfContact) {
        connectOfContact = new Connection({ user: contactObjectId, contacts: [] });
    }
    connectOfContact.contacts.push({ contact: userIDobj, update: "Added as a contact" });
    await connectOfContact.save({ validateBeforeSave: false });

    // Add contact to user's connections
    connect.contacts.push({ contact: contactObjectId, update: "Added as a contact" });
    await connect.save({ validateBeforeSave: false });

    res.status(201).json(new ApiResponse(201, { user, connect }, "Contact added successfully"));
});


const getConnections = asyncHandler(async (req, res) => {
    const user = req.user;
    const connections = await getUserConnectionsWithDetails(user._id);
    const roomList = await getRoomsForUser(user._id);
    if (!connections) throw new ApiError(401, "Unable to find connections");
    return res.status(201).json(new ApiResponse(201, { user, connections, roomList }, "Contacts found"));
});

export {
    createConnection,
    getConnections
};
