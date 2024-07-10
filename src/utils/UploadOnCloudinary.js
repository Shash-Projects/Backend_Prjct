import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

// We temporarily store data in db(localFilePath) before sending it to cloudinary
const uploadOnCloudinary = async (localFilePath)=>{

    try {
        if(!localFilePath) return null;
        //uploading on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto"
    })
        console.log("File uploaded successfully", response, response.url);
        return response.url;
    } catch (error) {
        //remove the locally saved temporary file as the upload failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}