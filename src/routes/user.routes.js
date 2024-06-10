import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    loginUser,
    logoutJWTUser,
    logoutUser,
    register,
    updateUserAvatar,
    updateAccountDetails,
    changeCurrentPassword
} from "../controllers/user.controller.js";
const router = Router();

router.route('/get-current-user').get(verifyJWT, (req, res) => res.status(200).json({user: req.user}))
router.route('/register').post(register);
router.route('/login').post(loginUser);
router.route('/Glogout').get(verifyJWT, logoutUser);
router.route('/Jlogout').post(verifyJWT, logoutJWTUser);
router.route('/Jlogout').post(verifyJWT, logoutJWTUser);
router.route('/update-avatar').post(verifyJWT, updateUserAvatar)
router.route('/update-account-detail').post(verifyJWT, updateAccountDetails);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);


export default router