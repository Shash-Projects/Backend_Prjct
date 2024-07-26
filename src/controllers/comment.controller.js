import { isValidObjectId } from "mongoose";
import { Comment} from "../models/Comment.models.js";
import { Video } from "../models/Video.models.js"
import { asyncWrapper } from "../utils/AsyncWrapper.js";
import { HandleError } from "../utils/ErrorHandling.js";
import { HandleResponse } from "../utils/ResponseHandling.js";

const makeComment = asyncWrapper(async(req, res)=>{
   
    const {videoId} = req.params;
    const {content} = req.body;
    

    // verfying content is not empty & video id is valid 
    if(!content || content.trim()=='') throw new HandleError(401, " Content is a required field ");
    if(!isValidObjectId(videoId)) throw new HandleError(409, " Error Invalid Video Id ");

    const video = await Video.findById(videoId);
    if(!video) throw new HandleError(404, " Error: Video with given id does not exist ");

    const comment = await Comment.create({
        content,
        video: video._id,
        owner: req.user?._id
    })

    if(!comment) throw new HandleError(501, "Error: Server unable to make comment ");

    return res.status(200)
    .json(new HandleResponse(200, comment, " Comment made successfully "))

})

const getVideoComments = asyncWrapper(async(req,res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)) throw new HandleError(403, " Error: Invalid Video Id ");

    const videoComments = await Comment.find({video: videoId});

    if(!videoComments.length) throw new HandleError(400, " NO Comments found ");

    return res.status(200)
    .json(new HandleResponse(200, videoComments, " Comments fetched for video successfully "))

})

const deleteComment = asyncWrapper(async(req, res)=>{
    
    const {commentId} = req.params;
    
    if(!isValidObjectId(commentId)) throw new HandleError(409, " Error Invalid Comment Id ");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new HandleError(404, "Comment does not exist");
    
    if(comment.owner.toString() !== req.user?._id.toString()) throw new HandleError(403, " User not authorised to perform this action ");

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment) throw new HandleError(501, " Error in deleting the comment ");

    return res.status(200)
    .json(new HandleResponse(200, deletedComment, " COmment deleted Successfully "));


})

export {makeComment, getVideoComments, deleteComment}
// Why do we use aggreagate pipelines, if we can provide fileters as object inside "model.find()"