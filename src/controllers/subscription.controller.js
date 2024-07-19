import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/Subscriptiion.models.js";
import { asyncWrapper } from "../utils/AsyncWrapper.js";
import { HandleError } from "../utils/ErrorHandling.js";
import { HandleResponse } from "../utils/ResponseHandling.js";

const toggleSubscription = asyncWrapper(async(req,res)=>{

    const {channelId} = req.params;
    const userId = req.user?._id;

    if(!channelId) throw new HandleError(404, ` Error, channel not found `);

    const subDoc = await Subscription.findOne({subscriber: userId, channel: channelId});
    if(!subDoc){
        const newSubscription = await Subscription.create({
                subscriber: userId,
                channel: channelId
        })

        return res.status(200)
        .json(new HandleResponse(200, newSubscription ," New Subscription created successfully "))

    }else{
        await subDoc.deleteOne();
        return res.status(200)
        .json( new HandleResponse(200, " Subscription cancelled successfully "))
    }
})

const getUserChannelSubscribers = asyncWrapper(async(req, res)=>{

    const {channelId} = req.params;

    // Validating whther channelId is correct mongoDb objectID
    if(!isValidObjectId(channelId)) throw new HandleError(409, " Error: Invalid Channel Id ");

    // POPULATING subscriber field with user info
    const subscribers = await Subscription.find({channel:channelId})
    .populate("subscriber", "userName email avatar");

    if(!subscribers.length){
        throw new HandleError(404, " No subscribers found ")
    }
    
    return res.status(200)
    .json ( new HandleResponse(200, subscribers, " Subscribers fetched successfully "))

})

const getSubscribedChannels = asyncWrapper(async(req, res)=>{
    const {subscriberId} = req.params;

    if(!isValidObjectId(subscriberId)) throw new HandleError(404, " Error: not a valid subscriberId")

    const channelsSubscribed = await Subscription.find({subscriber: subscriberId})
    .populate("channel", "avatar userName fullName email");

    if(!channelsSubscribed.length){
        throw new HandleError(404, " No subscribers found ")
    }
    
    return res.status(200)
    .json ( new HandleResponse(200, channelsSubscribed, " Subscribed Channel fetched successfully "))
})

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels};