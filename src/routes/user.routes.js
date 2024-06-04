import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    loginUser,
    logoutJWTUser,
    logoutUser,
    register
} from "../controllers/user.controller.js";
const router = Router();

router.route('/get-current-user').get(verifyJWT, (req, res) => res.status(200).json({user: req.user}))
router.route('/register').post(register);
router.route('/login').post(loginUser);
router.route('/Glogout').get(verifyJWT, logoutUser);
router.route('/Jlogout').post(verifyJWT, logoutJWTUser);
export default router