import {Router} from 'express';
import { loginUser, logoutUser, refreshAccessToken, registerUser } from '../controllers/user.controller.js';
import { upload } from '../middlewares/Upload.middleware.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';

// Creating instance of router package
const router = Router();

//as user goes to /register "registerUser" method will run
router.route("/register").post
    (
        // This middleware executes before registerUser controller
        // uploads files locally   
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount:1
            }
        ]),
        registerUser
    )

router.route("/login").post(loginUser);

// Secured Route
router.route("/logout").post( verifyJwt, logoutUser) // using this middleware we included user field in the "req" obj
router.route("/refresh-token").post(refreshAccessToken)

export default router;