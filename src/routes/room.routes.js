import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addMember, createRoom } from "../controllers/room.controller.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router= Router();
router.use(verifyJWT);

router.route('/create').post(createRoom);
router.route('/add').post(addMember);
router.route('/test').get((req,res)=>{
    res.json(new ApiResponse(201,{},"afa"))
})

export default router;