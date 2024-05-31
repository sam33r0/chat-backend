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

export {
    createRoom,
    addMember
}