import {Router} from 'express';
import { registerUser } from '../controllers/user.controller.js';
import { upload } from '../middlewares/Upload.middleware.js';

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

export default router;