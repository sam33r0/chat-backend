import mongoose from "mongoose";
import { Room } from "../models/room.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

const createRoom = asyncHandler(async (req, res) => {
    const {title} = req.body;
    const user= new mongoose.Types.ObjectId(req.user?._id);
    const members= [];
    members.push(user);
    const existingRoom = await Room.findOne({title});
    if(existingRoom)
        {
            throw new ApiError(402, "room already exist");
        }
    const room= await Room.create({
        title,
        members
    })
    if(!room)
        throw new ApiError(401 , "unable to create room");
    return res.status(201).json(new ApiResponse(201, room, "room created"));
})

export {
    createRoom
}