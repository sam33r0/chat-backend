import mongoose from "mongoose";
import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createRoom = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const user = new mongoose.Types.ObjectId(req.user?._id);
    const members = [];
    members.push(user);
    const existingRoom = await Room.findOne({ title });
    if (existingRoom) {
        throw new ApiError(402, "room already exist");
    }
    const room = await Room.create({
        title,
        members
    })
    if (!room)
        throw new ApiError(401, "unable to create room");
    return res.status(201).json(new ApiResponse(201, room, "room created"));
})


const addMember = asyncHandler(async (req, res) => {
    const rid = req.params;
    const user = req.user;
    const { roomId, title } = req.body;
    const fRoomId = rid || roomId;
    if (!fRoomId && !title) {
        throw new ApiError(401, "room ID not found");
    }
    const room = await Room.findOne({ $or: [{ _id: fRoomId }, { title }] });
    if (!room) {
        throw new ApiError(401, " room not found");
    }

    const member = new mongoose.Types.ObjectId(user?._id);
    room.members.push(member);
    await room.save({ validateBeforeSave: false });
    return res.status(201).json(new ApiResponse(201, room, "member added"));
})

const roomMessage = asyncHandler(async (req, res) => {

    const rid = req.params;
    const { roomId } = req.body;
    const user = req.user;
    const id = new mongoose.Types.ObjectId(rid || roomId);
    const messages = await DirectMessage.aggregate([
        {
            $match: {
                room: id
            }
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
            $addFields: {
                authorName: {
                    $first: "$authorName"
                }
            }
        },
        {
            $lookup: {
                from: "rooms",
                localField: "room",
                foreignField: "_id",
                as: "roomName",
                pipeline: [{
                    $project: {
                        title: 1,
                        members: 1,
                    }
                }]
            }
        },
        {
            $addFields: {
                roomDetail: {
                    $first: "$roomName"
                }
            }
        },
        {
            $project: {
                content: 1,
                author: 1,
                room: 1,
                roomDetail: 1,
                authorName: 1
            }
        }
    ])
    if (messages?.length == 0)
        throw new ApiError(401, "Unable to retreive messages");
    return res.status(201).json(new ApiResponse(201, messages, "messages aggregated"));


})
export {
    createRoom,
    addMember
}