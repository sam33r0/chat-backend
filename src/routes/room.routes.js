import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addMember, createRoom, roomDetail, userRoomsList } from "../controllers/room.controller.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router= Router();
router.use(verifyJWT);
router.route('/').get(userRoomsList)
router.route('/detail').post(roomDetail)
router.route('/create').post(createRoom);
router.route('/add').post(addMember);
router.route('/test').get((req,res)=>{
    res.json(new ApiResponse(201,{user: req.user},"afa"))
})

export default router;