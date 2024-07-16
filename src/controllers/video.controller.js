import {Video} from '../models/Video.models.js'
import { asyncWrapper } from '../utils/AsyncWrapper.js'
import { HandleError } from '../utils/ErrorHandling.js'
import { HandleResponse } from '../utils/ResponseHandling.js'
import { DeleteOnCloudinary, UploadOnCloudinary } from '../utils/UploadOnCloudinary.js'

// upload
// play - pause
// include in watch history
// comment 
// likes
// viewsCount

const uploadVideo = asyncWrapper(async(req, res)=>{
    // login required
    // take data
    // local file -> cloudinary -> update db

    const { title, description} = req.body;
    if(!title){
        throw new HandleError(400, " Title is a required field ")
    }

    // checking for existing video with same title
    const existingVideo = await Video.findOne({title});
    if(existingVideo){
        throw new HandleError(409, " Video with same title already exists ")
    }

    let videoLocalPath, thumbnailLocalPath;
    if(req.files && req.files.videoFile){
        videoLocalPath = req.files.videoFile[0]?.path;
    }
    if(req.files && req.files.thumbnailFile){
        thumbnailLocalPath = req.files.thumbnailFile[0]?.path;
    }

    if(!videoLocalPath && !thumbnailLocalPath){
        throw new HandleError(401, " Video and thumbnail are a required field ")
    }


    const [videoFile, thumbnailFile] = await Promise.all([
        UploadOnCloudinary(videoLocalPath), UploadOnCloudinary(thumbnailLocalPath)])

    if(!videoFile && !thumbnailFile){
        throw new HandleError(400, " Video or thumbnail failed to upload")
    }

    // create entry
    const videoEntry = await Video.create({
        title,
        description: description || "",
        thumbnail: thumbnailFile.url,
        videoFile: videoFile.url,
        duration: videoFile.duration,
        owner: req.user._id

    })

    if (!videoEntry) {
        throw new HandleError(400, " Something went wrong in uplaoding the video")
    }

    return res.status(200)
    .json( new HandleResponse(200, {videoEntry}, " Video uploaded successfully "));







})

const updateVideoDetails = asyncWrapper(async(req, res)=>{
    
    // title, description and thumbnail
    const videoId = req.params.videoId;
    const {title, description} = req.body;
    console.log("Hiiiiiiiiiiiiiiiiiii \n", req.file)

    const thumbnailLocalPath = req.file?.path;
    console.log("------hihihihi---------",req.file);
    const thumbnail = await UploadOnCloudinary(thumbnailLocalPath);
    

    if(!title && !description && !thumbnailLocalPath){
        return new HandleError(401, " At least one of the field need to be updated ")
    }

    const targetVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title, description, thumbnail: thumbnail.url
            }
        },{
            new: true
        }
    )

    return res.status(200)
    .json( new HandleResponse(200, targetVideo, " Detail updated successfully "))
})

const deleteVideo = asyncWrapper(async(req, res)=>{
    // del from cloudinary as well as frm db
    const videoId = req.params.videoId;
    console.log("----dfdjdffjk------");

    if(!videoId) throw new HandleError(404, " video ID not sent through url ");

    // Insert => OWNER- VERIFICAATION

    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if (!deletedVideo) {
        return new HandleError(404, " Error in finding any such video ")
    }

    console.log("----delted video-----",deletedVideo);
    DeleteOnCloudinary(deletedVideo.videoFile);

    return res.status(200)
    .json( new HandleResponse(200, " Video deleteed successfully "));

})

const getVideoById = asyncWrapper(async(req, res)=>{
    const videoId = req.params.videoId;
    
    //Populates field in a document with data from another collection based on a reference
    const video = await Video.findById(videoId)
    .populate({
        path: "owner",
        select:"avatar userName fullName"
    }).exec();  //This method executes the query. In Mongoose, most queries are not executed immediately; they build up a chain of commands

    if(!video) new HandleError(402, " Error in finding any such video ")

    return res.status(200)
    .json(new HandleResponse(200, video, " Video fetched successfully "))
})

const getAllVideos = asyncWrapper(async(req, res)=>{
    
})



export {uploadVideo, updateVideoDetails, deleteVideo, getVideoById};