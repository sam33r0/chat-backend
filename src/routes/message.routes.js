import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { directMessList, directMessage, roomMessage } from "../controllers/message.controller.js";

const router = Router();
router.use(verifyJWT);

router.route('/direct').post(directMessage);
router.route('/group').post(roomMessage);
router.route('/:rid').get(directMessList);
router.route('/').post(directMessList);
export default router;