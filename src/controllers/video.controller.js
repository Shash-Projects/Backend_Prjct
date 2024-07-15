import {Video} from '../models/Video.models.js'
import { asyncWrapper } from '../utils/AsyncWrapper.js'
import { HandleError } from '../utils/ErrorHandling.js'
import { HandleResponse } from '../utils/ResponseHandling.js'
import { UploadOnCloudinary } from '../utils/UploadOnCloudinary.js'

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


    const {videoFile, thumbnailFile} = await Promise.all([
        UploadOnCloudinary(videoLocalPath), UploadOnCloudinary(thumbnailLocalPath)])

    if(!videoFile && !thumbnailFile){
        throw new HandleError(400, " Video or thumbnail failed to upload")
    }
    console.log(videoFile);

    // create entry
    const videoEntry = await Video.create({
        title,
        description: description || "",
        thumbnail: thumbnailFile.url,
        videoFile: videoFile.url,
        duration: videoFile.duration,

    })

    if (!videoEntry) {
        throw new HandleError(400, " Something went wrong in uplaoding the video")
    }

    return res.status(200)
    .json( new HandleResponse(200, {videoEntry}, " Video uploaded successfully "));







})


export {uploadVideo};