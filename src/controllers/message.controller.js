import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Message } from "../models/messages.model.js";
import { DirectMessage } from "../models/directMessage.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Room } from "../models/room.model.js";
import mongoose from "mongoose";
import { Connection } from "../models/connections.model.js";

const directMessage = asyncHandler(async (req, res) => {
    const user = req.user;
    const { content, recieverId } = req.body;
    const rec = recieverId;
    const author = new mongoose.Types.ObjectId(user?._id);
    const reciever = new mongoose.Types.ObjectId(rec);
    const userConnection = await Connection.findOne({ user: author });
    const recConnection = await Connection.findOne({ user: reciever });
    const recIndex = userConnection.contacts.findIndex(x => x.contact.equals(reciever));
    //console.log(userConnection,recIndex);
    userConnection.contacts[recIndex].update = `new message at ${new Date()}`;

    const userIndex = recConnection.contacts.findIndex(x => x.contact.equals(author));
    recConnection.contacts[userIndex].update = `new message at ${new Date()}`;

    await userConnection.save({ validateBeforeSave: false });
    await recConnection.save({ validateBeforeSave: false });

    const dm = await DirectMessage.create({
        content,
        author,
        reciever
    })
    if (!dm)
        throw new ApiError(401, "could not send message");
    return res.status(201).json(new ApiResponse(200, dm, "successfully send"))
})

const roomMessage = asyncHandler(async (req, res) => {
    
    const user = req.user;
    const { roomID, content, roomName } = req.body;
    const _id = roomID;
    const room = await Room.findOne({
        $or: [{ _id }, { roomName }]
    });
    if (!room) {
        throw new ApiError(401, "Room not found")
    }
    const userObjectId = new mongoose.Types.ObjectId(user?._id);
    if (!room.members.includes(userObjectId)) {
        room.members.push(userObjectId);
        await room.save({ validateBeforeSave: false })
    }
    const RoomObjectId = new mongoose.Types.ObjectId(room._id);
    const message = await Message.create({
        content: content,
        author: userObjectId,
        room: RoomObjectId
    })
    room.update = `new message at ${new Date()} by ${user.fullName}`;
    if (!message)
        throw new ApiError(401, "Unable to send the message");
    await room.save({ validateBeforeSave: false });
    return res.status(201).json(new ApiResponse(201, message, "Message sent successfully"));
})

const directMessList = asyncHandler(async (req, res) => {
    const { rec, page = 1, limit = 10 } = req.body;
    const user = req.user;
    const id = rec;
    const skip = (page - 1) * limit;

    const messages = await DirectMessage.aggregate([
        {
            $match: {
                $or: [
                    {
                        $and: [
                            { reciever: new mongoose.Types.ObjectId(user._id) },
                            { author: new mongoose.Types.ObjectId(id) }
                        ]
                    },
                    {
                        $and: [
                            { reciever: new mongoose.Types.ObjectId(id) },
                            { author: new mongoose.Types.ObjectId(user._id) }
                        ]
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorName",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "reciever",
                foreignField: "_id",
                as: "recieverName",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                sender: { $first: "$authorName" },
                recieverUser: { $first: "$recieverName" }
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by createdAt in descending order
        },
        {
            $skip: skip // Skip documents for pagination
        },
        {
            $limit: limit // Limit documents for pagination
        },
        {
            $project: {
                _id: 1,
                recieverUser: 1,
                sender: 1,
                content: 1,
                createdAt: 1 // Optionally include createdAt if you need to see the timestamps
            }
        }
    ]);

    // Count total messages for pagination metadata
    const totalMessages = await DirectMessage.countDocuments({
        $or: [
            {
                $and: [
                    { reciever: new mongoose.Types.ObjectId(user._id) },
                    { author: new mongoose.Types.ObjectId(id) }
                ]
            },
            {
                $and: [
                    { reciever: new mongoose.Types.ObjectId(id) },
                    { author: new mongoose.Types.ObjectId(user._id) }
                ]
            }
        ]
    });

    return res.status(201).json(new ApiResponse(201, {
        messages,
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: page,
        totalMessages
    }, "messages aggregated"));
});

export {
    directMessage,
    roomMessage,
    directMessList
}