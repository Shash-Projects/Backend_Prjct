import { User } from '../models/User.models.js'
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

    const video = await Video.findById(videoId);

    if(!(req.user._id !== video.owner.toString() )){
        throw new HandleError(403, " You are not authorised to perform this action ")
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
    const video = await Video.findById(videoId);
    if(!(req.user._id !== video.owner.toString() )){
        throw new HandleError(403, " You are not authorised to perform this action ")
    }

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
    const {page=1, limit=10, query, userId, sortBy, sortType} = req.query;

    const matchStage = {
        $match:{
            // Array of independent criteria for text search in title and description field
            // options= "i" make the search case insensitive 
            $or:[{ title: {$regex: query, $options: "i"}},
                 { description: {$regex: query, $options: "i"}}
                ],
                // This is a second layer of AND filter, where if userId is provided then it should be a 
                // creteria for search
                // This matches owner field with one that is stored in DB
            ...(userId && {owner: new mongoose.Types.ObjectId(userId)})    
        }
    };

    const lookupStage = {
        // will return a new field ownerD populated with an array of details
        // it matches the data in foreign field with local field
        $lookup: {
            from: "users",
            foreignField: "_id",
            localField: "owner",
            as: "ownerDetails"
        }
    }

    const unwindStage = {
        // it creates multiple doc by 1-to-1 matching rest of the data with the 
        // elements of array speciefied in "path"
        // for single element it just flattens the array
        $unwind: {
            path: "ownerDetails",
            preserveNullAndEmptyArrays: true 
            // even if the array is null or undefined,the document is preserved with a null value for the ownerDetails field.
            // This is useful to avoid losing documents that do not have matching users in the $lookup stage.
        }
    }

    const projectStage ={
        $project:{
            videoFile:1,
            thumbnailFile:1,
            title:1,
            description:1,
            createdAt: 1,
            //views:1
            duration:1,
            owner:1,
            "ownerDetails.userName":1,
            "ownerDetails.avatar":1
        }
    }

    const sortStage = {
        $sort: {
            [sortBy]: sortType==="desc"? -1:1,
        }
    }

    const allAggregate = Video.aggregate([
        matchStage,
        lookupStage,
        unwindStage,
        projectStage,
        sortStage
    ]);

    const paginationOptions = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        customLabels: {
          totalDocs: "totalDocs",
          docs: "docs",
          limit: "limit",
          page: "page",
          totalPages: "totalPages",
          nextPage: "nextPage",
          prevPage: "prevPage",
          pagingCounter: "pagingCounter",
          meta: "pagination",
        },
      };

      const result = await Video.aggregatePaginate(allAggregate, paginationOptions);
      if(!result) throw new HandleError(501, " Error while fetching videos from database ");

      return res.status(200)
      .json(new HandleResponse(200, result, " All Videos fetched succeffully "))
})

const getAllVideosWithSearchAndUploaderInfo = asyncWrapper(async(req, res)=>{
    const {
        page=1, 
        limit=10 ,
        query='', 
        sortBy='createdAt',
        sortType='desc', 
        userName, 
        fullName
    } = req.query;

    const userId = req.user?._id;
    const sortOrder = sortType.toLowerCase() === 'desc'? -1:1
    const matchConditions =[];

    if(query){
        matchConditions.push({
            $or:[
                // text search on title and description
                {title:{$regex: query, $options: 'i'}},
                {description: {$regex: query, $options:'i'}}

            ]
        })
    }


   if(userName || fullName){

    const userMatchConditions = {}
    if(userName){
        userMatchConditions.userName = {$regex: userName, options:'i'}
    }

    if(fullName){
        userMatchConditions.fullName = {$regex: fullName, options:'i'}
    };

    // It returns an array of user documents(obj) containing only ids
    const users = await User.find(userMatchConditions).select("_id").exec();
    const usersId = users.map((user)=> user._id);
    // this now is an array of user ids (not user obj containig only id field)
    matchConditions.push({ owner: {$in: usersId}})

   }

   const matchStage = matchConditions.length >0?
        {$match: {$and: matchConditions}}
        :{$match: {}};

    // {
    //     $match:{
    //         $and:{
    //             $or:{
    //                 {title:{$regex: query, $options: 'i'}},
    //                 {description: {$regex: query, $options:'i'}}
    //             },
    //             { owner: {$in: usersId}}
    //         }
    //     }
    // }

    const lookupStage = {
        from: "users",
        foreignField: "_id",
        localField:"owner",
        as: "ownerDetails"
    }

    const unwindStage = {
       $unwind: { 
        path: "ownerDetails",
        preserveNullAndEmptyArrays: true
    }
    }

    // ADD  LIKE_VIDEO LOOKUP AND FUNCTIONALITY

    const projectStage= {
        $project: {
            videoFile:1,
            thumbnail:1,
            duration:1,
            createdAt:1,
            updatedAt:1,
            owner:1,
            "owner.userName":1,
            "owner.avatar":1,
            "owner.fullName":1
            // views, isLikedByUser, likes, subscribe

        }
    }

    const sortStage = {
        $sort: {
          [sortBy]: sortOrder,
        },
    };

    const aggregation= {
        matchStage,
        lookupStage,
        unwindStage,
        // lookup likes
        projectStage,
        sortStage
    }

    const paginateOptions = {
        
        // even no. received from query are in string format, paginate requires them to be in no.
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }


    const result = await Video.aggregatePaginate(aggregation, paginateOptions);
    if(!result) throw new HandleError(501, " Error while fetching videos from database ")

    return res.status(200)
    .json( new HandleResponse(200, result, " Videos fethed successfully "))    
   
})



export {uploadVideo, updateVideoDetails, deleteVideo, getVideoById,
    getAllVideos, getAllVideosWithSearchAndUploaderInfo
};