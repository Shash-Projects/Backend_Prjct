import jwt from 'jsonwebtoken';
import { asyncWrapper } from '../utils/AsyncWrapper.js';
import { HandleError } from '../utils/ErrorHandling.js';
import { User } from '../models/User.models.js'; 

// Verifying that the user is loggedin using presence of accessTokens
export const verifyJwt = asyncWrapper(async(req, res, next)=>{

    try {
        // Authorization: Bearer <AccessToken>: this is how it is present in headers
        const token = req.cookies?.accessToken || req.headers("Authorization").replace("Bearer ", '');
        if(!token){
            throw new HandleError(401, "Unauthorised Request")
        }

        // Extracting user info from accessToken, requires accessTokenSecret
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        
        if (!user) {
            throw new HandleError(401, " Invalid access token ")
        }

        // since "req" & "res" are just objects, we are adding another prop 
        // to req to target user while he is logged in
        req.user = user;
        next();
        } catch (error) {
            throw new HandleError(401, error?.message || "Invalid access Token ")
        }

})