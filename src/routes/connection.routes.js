import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createConnection, getConnections } from "../controllers/connection.controller.js";


const router = Router();
router.use(verifyJWT);

router.route('/').get(getConnections);
router.route('/create').post(createConnection);


export default router;