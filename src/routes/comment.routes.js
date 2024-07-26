import { Router } from "express";
import { deleteComment, getVideoComments, makeComment } from "../controllers/comment.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:videoId").get(getVideoComments)
router.route("/:videoId").post(verifyJwt, makeComment)

router.route("/c/:commentId").delete(verifyJwt ,deleteComment);


export default router;