import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Message } from "../models/messages.model.js";
import { DirectMessage } from "../models/directMessage.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Room } from "../models/room.model.js";
import mongoose from "mongoose";

const directMessage = asyncHandler(async (req, res) => {
    const user = req.user;
    const recieve = req.params;
    const { content, recieverId } = req.body;
    const rec = recieve || recieverId;
    const author = new mongoose.Types.ObjectId(user?._id);
    const reciever = new mongoose.Types.ObjectId(rec);
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
    const roomId = req.params;
    const user = req.user;
    const { roomID, content, roomName } = req.body;
    const fRoomId = roomID || roomId;
    const room = await Room.findOne({
        $or: [{ fRoomId }, { roomName }]
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
    if (!message)
        throw new ApiError(401, "Unable to send the message");
    return res.status(201).json(new ApiResponse(201, message, "Message sent successfully"));
})

const directMessList = asyncHandler(async (req, res) => {
    const rid = req.params;
    const { rec } = req.body;
    const user = req.user;
    const id = rid || rec;
    const messages = await DirectMessage.aggregate([
        {
            $match: {
                $and: [{ reciever: new mongoose.Types.ObjectId(id) }, { author: new mongoose.Types.ObjectId(user._id) }]
            },

        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorName",
                pipeline: [{
                    $project: {
                        fullName: 1,
                        avatar: 1,
                    }
                }]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "reciever",
                foreignField: "_id",
                as: "recieverName",
                pipeline: [{
                    $project: {
                        fullName: 1,
                        avatar: 1,
                    }
                }]
            }
        },
        {
            $addFields: {
                sender: {
                    $first: "$authorName"
                }
            }
        },
        {
            $addFields: {
                recieverUser: {
                    $first: "$recieverName"
                }
            }
        },
        {
            $project: {
                recieverUser: 1,
                sender: 1,
                content: 1,
            }
        }
    ])
    if (messages?.length == 0)
        throw new ApiError(401, "Unable to retreive messages");
    return res.status(201).json(new ApiResponse(201, messages, "messages aggregated"));

})

export {
    directMessage,
    roomMessage,
    directMessList
}