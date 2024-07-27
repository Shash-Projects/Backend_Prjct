import { isValidObjectId } from "mongoose";
import { Like } from "../models/Like.models.js";
import { asyncWrapper } from "../utils/AsyncWrapper.js";
import { HandleError } from "../utils/ErrorHandling.js";
import { HandleResponse } from "../utils/ResponseHandling.js";

const toggleVideoLike = asyncWrapper(async(req, res)=>{
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)) throw new HandleError(409, " Error Invalid videoID ");

    const likedVideo = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    });

    if(likedVideo){
        await Like.deleteOne();
        return res.status(200)
        .json(new HandleResponse(200, " Video not liked anymore "))
    }else{
        await Like.create({
            likedBy: req.user._id,
            video: videoId
        })
        return res.status(200)
        .json(new HandleResponse(200, " Video  liked successfully "))
    }
})

const toggleCommentLike = asyncWrapper(async(req, res)=>{
    const {commentId} = req.params;

    if(!isValidObjectId(commentId)) throw new HandleError(409, " Error Invalid commentID ");

    const likedComment = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId
    });

    if(likedComment){
        await Like.deleteOne();
        return res.status(200)
        .json(new HandleResponse(200, " Comment not liked anymore "))
    }else{
        await Like.create({
            likedBy: req.user._id,
            comment: commentId
        })
        return res.status(200)
        .json(new HandleResponse(200, " Comment  liked successfully "))
    }
})

const toggleTweetLike = asyncWrapper(async(req, res)=>{
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)) throw new HandleError(409, " Error Invalid tweetID ");

    const likedTweet = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId
    });

    if(likedTweet){
        await Like.deleteOne();
        return res.status(200)
        .json(new HandleResponse(200, " Tweet not liked anymore "))
    }else{
        await Like.create({
            likedBy: req.user._id,
            tweet: tweetId
        })
        return res.status(200)
        .json(new HandleResponse(200, " Tweet  liked successfully "))
    }
})

const getLikedVideos = asyncWrapper(async(req, res)=>{

    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: {$exists: true} //helps to avoid cases where the video field might be missing or null.
        })
    .populate({
        path: video,
        populate: {
            path: owner,
            select: "userName, fullName, avatar"
        }
    })
    .exec()

    if (!likedVideos.length) throw new HandleError(404, "No liked videos found");

    return res.status(200)
    .json(new HandleResponse(200, likedVideos, " Liked videos fetched successfully "))



})




export {toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos};