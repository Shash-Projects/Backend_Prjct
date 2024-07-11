import { asyncWrapper} from '../utils/AsyncWrapper.js';
import { HandleError } from '../utils/ErrorHandling.js';
import { HandleResponse } from '../utils/ResponseHandling.js';
import { User } from '../models/User.models.js';
import { UploadOnCloudinary } from '../utils/UploadOnCloudinary.js'


// higher order func accepting another func as parameter
const registerUser = asyncWrapper(async (req, res)=>{
    
    // data in "json" and "form" comes inside body
    const {userName, fullName, email, password} = req.body;
    console.log(req.body);

    // validating whether fields are empty or not
    if (
        //calls each element in the array until the func returns a value which is true
        [userName, fullName, email, password].some((field)=>
            field?.trim === ""
     )
    ){
        throw new HandleError(400, `${field} is a required field`)
    }

    // checking if email is in the proper format
    if (!email.includes("@")) {
        throw new HandleError(400, "Please fill a valid email")
    }

    // Checking whether user already exists or not
    // User model allow us to directly check in mongo DB
    const existingUser = await User.findOne({
        $or: [{userName}, {email}]
    })
    if (existingUser) {
        throw new HandleError(409, "User with given userName and email already exists")
    }

    // Checking files: multer provides additional option of "files"
    // The 1st prop of array gives us the path
    let avatarLocalPath;
    if(req.files && req.files.avatar && req.files.avatar.length>0){
        avatarLocalPath = req.files?.avatar[0]?.path;
   }
    

    let coverImageLocalPath;
    if(req.files && req.files.coverImage && req.files.coverImage.length>0){
         coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    // Checking that coverImage is not an empty field
    if (!avatarLocalPath) {
        throw new HandleError(400, "Avatar is a required field")
    }

    // Uploading files to cloudinary
     const avatar = await UploadOnCloudinary(avatarLocalPath);
     const coverImage = await UploadOnCloudinary(coverImageLocalPath);

     // Checking whther avatar go uploaded or not
     if (!avatar) {
        throw new HandleError(400, "Avatar failed to upload")
    }

    // Uploading data on DB
    const user = await User.create({
        fullName,
        userName :userName.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    })
    // Removing password and refresh token from res
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  // by default all are selected
    )

    if (!createdUser) {
        throw new HandleError(500, "Something went wrong in creating user")
    }
    
    return res.status(201).json(
        new HandleResponse(200, createdUser, "User succesffully registered")
    )
})

export {registerUser}