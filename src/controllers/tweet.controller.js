import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/Tweet.models.js";
import { asyncWrapper } from "../utils/AsyncWrapper.js";
import { HandleError } from "../utils/ErrorHandling.js";
import { HandleResponse } from "../utils/ResponseHandling.js";

const createTweet = asyncWrapper(async(req,res)=>{
    const {content} = req.body;

    // Checking for empty data
    if(!content || content.trim() ==="") throw new HandleError(401, " Error: Content is a required field ");

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if(!tweet) throw new HandleError(501, " Error in creating new tweet document ");

    return res.status(200)
    .json( new HandleResponse(200, tweet, " Tweet created successfully "))

})

const updateTweet = asyncWrapper(async(req, res)=>{
    const {tweetId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(tweetId)) throw new HandleError(409, " Error: Invalid Tweet Id ");

    if(!content || content.trim() ==="") throw new HandleError(401, " Error: Content is a required field ");

    const tweet = await Tweet.findById(tweetId);

    if(!tweet) throw new HandleError(404, " No such tweet found ");

    // Authorisation
    if(!(req.user._id !== tweet.owner.toString() )){
        throw new HandleError(403, " You are not authorised to perform this action ")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, 
        {
            $set:{content}
        },
        { new: true }
    )
    

    return res.status(200)
    .json(new HandleResponse(200, updatedTweet, " Tweet updated successfully" ))
})

const deleteTweet = asyncWrapper(async(req, res)=>{
    const { tweetId }= req.params;
    if(!isValidObjectId(tweetId)) throw new HandleError(409, " Error: Invalid Tweet Id ");
    
    const tweet = await Tweet.findById(tweetId);
    if(!tweet) throw new HandleError(404, " No such tweet found ");

    // Authorisation
    if(!(req.user._id !== tweet.owner.toString() )){
        throw new HandleError(403, " You are not authorised to perform this action ")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet) throw new HandleError(501, " Error: failed to delete the tweet ")

    return res.status(200)
    .json(new HandleResponse(200, deletedTweet, " Tweet deleted successfully ")) 


})

const getUserTweets =asyncWrapper(async(req, res)=>{

    const {userId} = req.params;
    console.log(req.params)
    if(!isValidObjectId(userId)) throw new HandleError(409, " Invalid user id ")

    // gets a list of documents that match filter    
    const userTweets = await Tweet.find({ owner: userId});
    if(!userTweets.length ) throw new HandleError(400, " No tweets found ");

    return res.status(200)
    .json(new HandleResponse(200, userTweets, " Tweets fetched successfully "))

})


export {createTweet, updateTweet, deleteTweet, getUserTweets};