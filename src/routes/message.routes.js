import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { directMessList, directMessage, roomMessage } from "../controllers/message.controller.js";
import { roomMessageList } from "../controllers/room.controller.js";

const router = Router();
router.use(verifyJWT);

router.route('/direct').post(directMessage);
router.route('/room-message').post(roomMessage);
router.route('/').post(directMessList);
router.route('/room').post(roomMessageList);
export default router;