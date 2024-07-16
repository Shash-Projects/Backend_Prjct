import { Router} from 'express';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/Upload.middleware.js';
import { deleteVideo, getVideoById, updateVideoDetails, uploadVideo } from '../controllers/video.controller.js';

const router = Router();
router.use(verifyJwt) // Apply verifyJwt on all routes

// secure routes
router.route("/").post(verifyJwt,
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

router.route("/:videoId")
.patch(upload.single("thumbnail"), updateVideoDetails)
.delete(deleteVideo)
.get(getVideoById)

export default router;