import { isValidObjectId } from "mongoose";
import { Playlist } from '../models/Playlist.models.js'
import { asyncWrapper } from '../utils/AsyncWrapper.js'
import { HandleError } from '../utils/ErrorHandling.js';
import { HandleResponse } from '../utils/ResponseHandling.js';

const createPlaylist = asyncWrapper(async(req,res)=>{

    const {name, description} = req.body;
    if(!name || name.trim() === '') throw new HandleError(400, " Error: Name of playlist is a required field ");

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user._id
    })

    if(!playlist) throw new HandleError(501, " Error: Something went wrong in creating playlist");

    return res.status(200)
    .json(new HandleResponse(200, playlist, " Playlist created successfully "))

})

const getUserPlaylists = asyncWrapper(async(req, res)=>{
    const {userId} = req.params;
    if(!isValidObjectId(userId)) throw new HandleError(409, " Error Invalid userId ");

    const playlists = await Playlist.find({
        owner: userId
    })

    if(!playlists) throw new HandleError(404, " Error: There are no playlists of that owner ");

    return res.status(200)
    .json(new HandleResponse(200, playlists, " Playlists fetched successfully "))



})

const addVideoToPlaylist = asyncWrapper(async(req, res)=>{
    const {videoId, playlistId}= req.params;
    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)) throw new HandleError(409, " Error Invalid ids ");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new HandleError(404, " Error: Playlist not found ");

    if(playlist.videos.includes(videoId)) throw new HandleError(401, " Video already exists in playlist ");

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200)
    .json(new HandleResponse(200, playlist, " Video added successfully to the playlist "))



})

const removeVideoFromPlaylist = asyncWrapper(async(req, res)=>{
    const {videoId, playlistId}= req.params;
    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)) throw new HandleError(409, " Error Invalid ids ");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new HandleError(404, " Error: Playlist not found ");

    // pay attention
    playlist.videos = playlist.videos.filter((video)=>{
        
       return video.toString() !== videoId;
        
    })
    await playlist.save();
    

    return res.status(200)
    .json(new HandleResponse(200, playlist, " Video successfully remove from playlist "))

})

const getPlaylistById = asyncWrapper(async(req, res )=>{
    const {playlistId} = req.params;
    if(!isValidObjectId(playlistId)) throw new HandleError(409, " Error Invalid PlaylistId ");

    const playlist = await Playlist.findById(playlistId)
    .populate({
        path: "owner",
        select: "userName fullName avatar"
    })
    .populate("videos") // retrieve the full details of these video documents rather than just their IDs.

    if(!playlist) throw new HandleError(404, " Error: No playlist found ");

    return res.status(200)
    .json(new HandleResponse(200, playlist, " Playlist fetched successfully "))

})

const updatePlaylist = asyncWrapper(async(req, res)=>{
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if(!isValidObjectId(playlistId)) throw new HandleError(409, " Error Invalid PlaylistId ");
    if((name && name.trim ==="") && (description && description.trim ==="")) throw new HandleError(409, " Error: Name or description must be provided ");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new HandleError(404, " Error: No playlist found ");

    //verify owner
    if(req.user._id.toString() !== playlist.owner.toString()) throw new HandleError(403, " User not authorised to perform this action ");

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $set:{
                name, description
            }
    }
    , {new : true});

    if(!updatedPlaylist) throw new HandleError(501, " Error: server failed to update playlist ");
    return res.status(200)
    .json(new HandleResponse(200, updatedPlaylist, " Playlist updated succesfully "))

})

const deletePlaylist = asyncWrapper(async(req, res)=>{
    const {playlistId} = req.params;
    if(!isValidObjectId(playlistId)) throw new HandleError(409, " Error Invalid PlaylistId ");

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) throw new HandleError(404, " Error: No playlist found ");

    if(req.user._id.toString() !== playlist.owner.toString()){
         throw new HandleError(403, " User not authorised to perform this action ");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if(!deletedPlaylist) throw new HandleError(501, " Error: failed to delete the playlist ");

    return res.status(200)
    .json(new HandleResponse(200, deletedPlaylist, " Playlist deleted successfully "))

})

export { createPlaylist, getUserPlaylists, addVideoToPlaylist, removeVideoFromPlaylist,
    getPlaylistById, updatePlaylist, deletePlaylist
 };