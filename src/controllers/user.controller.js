import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Connection } from "../models/connections.model.js";
import mongoose from "mongoose";
import { Room } from "../models/room.model.js";
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

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

const register = asyncHandler(async (req, res) => {
    const { email, fullName, avatar, age, password } = req.body;
    if (
        [fullName, email, age, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "incomplete data");
    }
    const existedUser = await User.findOne(
        { email }
    )

    if (existedUser)
        throw new ApiError(409, "User already exist");

    // if (!avatarLocalPath)
    //     throw new ApiError(409, "no dp to upload");

    //const avatar = await uploadOnCloudinary(avatarLocalPath);
    // if (!avatar)
    //     throw new ApiError(400, "Avatar file is required");
    const user = await User.create({
        email,
        fullName,
        avatar: avatar,
        age,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password "
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    const connections = await Connection.create({
        user: new mongoose.Types.ObjectId(createdUser._id),
        contacts: []
    })
    return res.status(201).json(
        new ApiResponse(201, createdUser, connections, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({
        email
    })
    if (!user) {
        throw new ApiError(404, "user does not exist please register");
    }
    const connections = await getUserConnectionsWithDetails(user._id);
    const roomList = await getRoomsForUser(user._id);
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Password");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true,

    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken, connections, roomList
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    // cookies clear
    // reset refreshToken
    const options = {
        httpOnly: true,
        secure: true,
    }
    res.clearCookie("accessToken", options).clearCookie("refreshToken", options);
    req.logout(function (err) {
        res.redirect(process.env.CORS_ORIGIN + '/login');
    })

})

const logoutJWTUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "user logged out successfully"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName && !email) {
        throw new ApiError(400, " All fields are required");
    }
    if (email) {
        const existedUser = await User.findOne({
            email
        })
        if (existedUser) {
            throw new ApiError(400, "email already exists");
        }
    }
    let user;
    if (email && fullName) {
        user = await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                fullName, email
            }
        }, { new: true }).select("-password ");
    }
    if (!email && fullName) {
        user = await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                fullName
            }
        }, { new: true }).select("-password ");
    }
    if (email && !fullName) {
        user = await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                email
            }
        }, { new: true }).select("-password ");
    }
    res.status(200).json(new ApiResponse(200, user, "Account details uploaded successfully"));

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    // const avatarLocalPath = req.file?.path
    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is missing");
    // }
    const { avatar } = req.body;
    if (!avatar.url) {
        throw new ApiError(400, "Cloudinary upload error");
    }
    const oldAvatar = req.user?.avatar;
    const user = await User.findByIdAndUpdate(
        req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }
    ).select("-password ");
    return res.status(200).json(new ApiResponse(200, user, "avatar updated successfull"));
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, {}, "password change successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json({ user: req.user });
})

export {
    register,
    loginUser,
    logoutUser,
    logoutJWTUser,
    updateAccountDetails,
    updateUserAvatar,
    changeCurrentPassword,
    getCurrentUser
}