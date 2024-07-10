import mongoose from 'mongoose';
import bcrypt from 'brcypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: [true, "UserName must be provided"],
            unique: [true, "UserName must be unique"],
        },
        email: {
            type: String,
            required: [true, "Email must be provided"],
            unique: [true, "UserName must be provided"],
        },
        fullName: {
            type: String,
            required: [true, "UserName must be provided"],
        },
        password:{
            type: String,
            required: [true, "password is necessary"]
        },
        avatar: {
            type: String,
            rquired: true,
        },
        coverImage:{
            type: String
        },
        refreshToken:{
            type: String,

        },
        watchHistory:[  // it will be array of videos
            {           // defining a schema
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timestamps: true
    }
)

// Password Encryption
// do not use arrow func in callback
// it does not give access to "this"

//"pre" hook allows us to run a function before an op occurs
userSchema.pre("save", async function(next){
    // password must be hashed only when pswd field is modified
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password, 10);
        next();
    }
    return next();
})

// Pswd verification 
// Creating a custom method of our own
userSchema.methods.isPasswordCorrect() = async function(){
    return await bcrypt.compare(password, this.password);
}
//Access tokens are short-lived Bearer tokens that clients use to access protected resources.
//They contain information about the user and the scope of access
userSchema.methods.genAccessTokens = function(){
    jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
            email: this.email
        },
        process.env.ACESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.genRefreshTokens = function(){
    jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);