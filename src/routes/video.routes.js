import { Router} from 'express';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/Upload.middleware.js';
import { uploadVideo } from '../controllers/video.controller.js';


const router = Router();

router.route("/upload-video").post(verifyJwt,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnailFile",
            maxCount:1
        }
        
    ]), uploadVideo)

export default router;