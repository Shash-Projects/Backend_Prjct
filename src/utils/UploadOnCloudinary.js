import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

// We temporarily store data in db(localFilePath) before sending it to cloudinary
const UploadOnCloudinary = async (localFilePath)=>{

    try {
        if(!localFilePath) return null;
        //uploading on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto"
    })
        console.log("File uploaded successfully");
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        //remove the locally saved temporary file as the upload failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

const DeleteOnCloudinary = async(filePath)=>{
    cloudinary.uploader.destroy(filePath, function(error, result){
        if(error){
            console.log("File on Cloudinary failed to delete")
        }else{
            console.log(" File deleted successfully", result);
        }
    })
}


export { UploadOnCloudinary, DeleteOnCloudinary};