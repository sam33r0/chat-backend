import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { directMessage, roomMessage } from "../controllers/message.controller";

const router = Router();
router.use(verifyJWT);

router.route('/direct').post(directMessage);
router.route('/group').post(roomMessage);

export default router;