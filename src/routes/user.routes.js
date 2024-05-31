import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    loginUser,
    logoutUser, 
    register } from "../controllers/user.controller";
const router = Router();

router.route('/register').post(register);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
export default router