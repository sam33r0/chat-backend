import mongoose from "mongoose";
import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/messages.model.js";

const createRoom = asyncHandler(async (req, res) => {
    const { title, memberList, avatar } = req.body;

    const existingRoom = await Room.findOne({ title });
    if (existingRoom) {
        throw new ApiError(402, "room already exist");
    }
    const user = new mongoose.Types.ObjectId(req.user?._id);
    const members = [];
    if (memberList)
        memberList.map((m) => members.push(new mongoose.Types.ObjectId(m._id)))
    members.push(user);


    const room = await Room.create({
        title,
        members,
        avatar
    })
    if (!room)
        throw new ApiError(401, "unable to create room");
    return res.status(201).json(new ApiResponse(201, room, "room created"));
})


const addMember = asyncHandler(async (req, res) => {
    const { roomId, title, memberList } = req.body;
    const fRoomId =  roomId;
    if (!fRoomId && !title) {
        throw new ApiError(401, "room ID not found");
    }
    const room = await Room.findOne({ $or: [{ _id: fRoomId }, { title }] });
    if (!room) {
        throw new ApiError(401, " room not found");
    }

    memberList.map((mem)=>{
        const member = new mongoose.Types.ObjectId(mem._id);
        room.members.push(member);
    })

    await room.save({ validateBeforeSave: false });
    return res.status(201).json(new ApiResponse(201, room, "member added"));
})

const roomDetail = asyncHandler(async (req, res) => {
    const { rid } = req.body;
    const detail = await Room.aggregate([{
        $match: {
            _id: new mongoose.Types.ObjectId(rid)
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "members",
            foreignField: "_id",
            as: "memberDetails"
        }
    },
    {
        $project: {
            _id: 1,
            title: 1,
            update: 1,
            createdAt: 1,
            updatedAt: 1,
            memberDetails: 1
        }
    }])
    return res.status(201).json(new ApiResponse(201, detail, "aggregated"));
})

const roomMessageList = asyncHandler(async (req, res) => {
    const { roomId, page = 1, limit = 10 } = req.body;
    const user = req.user;
    const rrid = roomId;
    const id = new mongoose.Types.ObjectId(rrid);
    const skip = (page - 1) * limit;

    const messages = await Message.aggregate([
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
            $sort: { createdAt: -1 } // Sort by createdAt in descending order to get the latest messages first
        },
        {
            $skip: skip // Skip documents for pagination
        },
        {
            $limit: limit // Limit documents for pagination
        },
        {
            $project: {
                content: 1,
                author: 1,
                room: 1,
                roomDetail: 1,
                authorName: 1,
                createdAt: 1,
            }
        }
    ]);

    // Count total messages for pagination metadata
    const totalMessages = await Message.countDocuments({ room: id });

    return res.status(201).json(new ApiResponse(201, {
        messages,
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: page,
        totalMessages
    }, "messages aggregated"));
});



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
                    update: { $first: "$update" },
                    avatar: { $first: "$avatar" },
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


const userRoomsList = asyncHandler(async (req, res) => {
    const user = req.user;
    const result = await getRoomsForUser(user._id);
    return res.status(201).json(new ApiResponse(201, result, "rooms aggregated"));
})


export {
    createRoom,
    addMember,
    roomMessageList,
    userRoomsList,
    roomDetail
}