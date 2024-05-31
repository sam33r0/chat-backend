import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { addMember, createRoom } from "../controllers/room.controller";

const router= Router();
router.use(verifyJWT);

router.route('/create').post(createRoom);
router.route('/add').post(addMember);

export default router;