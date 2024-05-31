import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { directMessage, roomMessage } from "../controllers/message.controller.js";

const router = Router();
router.use(verifyJWT);

router.route('/direct').post(directMessage);
router.route('/group').post(roomMessage);

export default router;