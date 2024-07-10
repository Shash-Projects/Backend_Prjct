import {asyncWrapper} from '../utils/AsyncWrapper.js';

// higher order func accepts another func as parameter
const registerUser = asyncWrapper(async (req, res)=>{
    res.status(200).json({
        message: "user registered"
    })
})

export {registerUser}