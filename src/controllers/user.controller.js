import { asyncWrapper} from '../utils/AsyncWrapper.js';
import { HandleError } from '../utils/ErrorHandling.js';
import { HandleResponse } from '../utils/ResponseHandling.js';
import { User } from '../models/User.models.js';
import { UploadOnCloudinary } from '../utils/UploadOnCloudinary.js'

const generateAccessAndRefreshTokens = async (userId)=>{

    try {
        const user = await User.findById(userId);
        const accessToken = user.genAccessTokens();
        const refreshToken = user.genRefreshTokens();

        user.refreshToken = refreshToken;
        // No validation will be required by this nad data will be saved in DB
        await user.save({ validateBeforeSave: false })
        
        return {accessToken, refreshToken};

    } catch (error) {
        console.log(error);
        throw new HandleError(500, "Failed to generate access & refresh tokens \n");
        
    }
    
}

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
   // console.log(req.files.avatar)
    

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

const loginUser = asyncWrapper(async(req, res)=>{
    // user details from req.body
    const {userName, email, password} = req.body;

    // checking whether fields are empty or not
    if (!userName && !email ){
        throw new HandleError(400, "Username or Email is required");
    }

    // looking for user in db
    // $or: allow us to search using multiple parameters
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!user){
        throw new HandleError(404, "User not found");
    }

    // Validate psed: we use custom method defined in our user model
    // "User" is a mongoose object, but custom method is defined in our user model
    const pswdValidity = await user.isPasswordCorrect(password);

    if (!pswdValidity ){
        throw new HandleError(401, "Incorrect Credentials");
    }

    // creating access & refresh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // the response that we must return
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //creating options object for cookies
    const options = {

        // by making these fields true our cookie will only be modifiable thru the server 
        // otherwise cookies can be modified by frontend as well
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new HandleResponse(200, {
            user: loggedInUser, accessToken, refreshToken       
        },
        " User LoggedIn successfully "
    ))
})

const logoutUser = asyncWrapper(async(req, res)=>{

    // middleware now allow us access to user in req
    await User.findByIdAndUpdate(
        // basis to query
        req.user._id,
        {
            //use the operator to update fields
            $set: {refreshToken: undefined}
        },
        {
            // so that it returns new response .i.e, updated
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accesToken", options)
    .clearCookie("refreshToken", options)
    .json( new HandleResponse(200," Logged Out Successfully "))
})

const refreshAccessToken = asyncWrapper(async (req, res)=>{

    // taking data from user cookies
    const userSideRefreshToken = req.cookies.refreshToken || req.header.refreshToken;

    if(!userSideRefreshToken){
        throw new HandleError(401, "Client's Refresh token not found")
    }

    // to target data in DB we need info
    const decodedToken = jwt.verify(userSideRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    if(decodedToken){
        const user = await User.findById(decodedToken._id);
        if(!user){
            throw new HandleError(401, "Invalid refresh token by client")
        }
    }
    
    // our user contains refresh token; comparing it with client's
    if(userSideRefreshToken !== user.refreshToken){
        throw new HandleError(401, " Client's Token is Expired ")
    }

    // Validated client and DB token are same;
    // generate new tokens
    const { newAccessToken, newRefreshToken} = generateAccessAndRefreshTokens(user._id);

    const options ={
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new HandleResponse(200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
            , " Tokens refreshed succesfully ")
    )

})

const changeCurrentPassword = asyncWrapper(async(req, res)=>{
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword && !newPassword){
        throw new HandleError(401, " Data fields cannot be empty ")
    }

    // validate the old password
    const user = await Users.findById(req.user._id);

    const isPswdCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPswdCorrect){
        throw new HandleError(400, " Incorrect credentials to change password ")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200)
    .json(
        new HandleResponse(200, " Passcowrd Changed Successfully ")
    )

    
})

const getCurrentUser = asyncWrapper(async(req, res)=>{
    return res.status(200)   // make use of veifyJwt middleware to accesss user
    .json(200, req.user, " Current user fetchedd Successfully ")
})

const updateAccountDetails = asyncWrapper(async(req, res)=>{

    const { userName, email } = req.body;

    if (!userName && !email) {
        throw new HandleError(401, " Kuch to de change krne k liye ")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {userName: userName, email}
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
    .json( new HandleResponse(200,user, " Details updated successfully "))
})

const updateAvatar = asyncWrapper(async(req, res)=>{

    let avatarLocalPath;
    if (req.file && req.file.avatar && req.file.avatar.length>0) {
        avatarLocalPath = req.file.avatar[0].path;
    }

    if(!avatarLocalPath){
        throw new HandleError(400, " New avatar could not be received ")
    }

    const avatar = await UploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new HandleError(401, " Error while uploading new avatar ")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {$set: { avatar : avatar.url }},
        { new: true }
    ).select("-password")

    return res.status(200)
    .json(
        new HandleResponse(200, user, " Avatar updated Successfully ")
    )
})

const updateCoverImage = asyncWrapper(async(req, res)=>{

    let coverImageLocalPath;
    if (req.file && req.file.coverImage && req.file.coverImage.length>0) {
        coverImageLocalPath = req.file.coverImage[0].path;
    }

    if(!coverImageLocalPath){
        throw new HandleError(400, " New coverImage could not be received ")
    }

    const coverImage = await UploadOnCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new HandleError(401, " Error while uploading new coverImage ")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {$set: { coverImage : coverImage.url }},
        { new: true }
    ).select("-password")

    return res.status(200)
    .json(
        new HandleResponse(200, user, " coverImage updated Successfully ")
    )
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, 
        changeCurrentPassword, getCurrentUser, updateAccountDetails,
        updateAvatar, updateCoverImage };