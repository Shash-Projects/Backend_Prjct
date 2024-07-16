import {Router} from 'express';
import { 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountDetails, 
    updateAvatar,
    updateCoverImage } from '../controllers/user.controller.js';
    
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
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, updateAccountDetails);
router.route("/update-avatar").patch(verifyJwt, 
    upload.single({name: "avatar"}), updateAvatar);

router.route("/update-cover-image").patch(verifyJwt, 
    upload.single("coverImage"), updateCoverImage
);

router.route("/c/:username").get(verifyJwt, getUserChannelProfile);  // taking data from params
router.route("/watch-history").get(verifyJwt, getWatchHistory)

export default router;