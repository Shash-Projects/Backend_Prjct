import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

export const app = express();

app.use(cors({
    // specify the domain of frontend which should be allowed to talk to our backend
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// different formats through which we can get data
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

// name of the folder which will contain static files
app.use(express.static("public")) 
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import playlistRouter from './routes/playlist.routes.js'

// Earlier we used to define route and controller simultaneously 
//but now things are segregated, we need o make use of middlewares

//route declaration
app.use("/api/v1/users", userRouter) // as user goes to /users controll will pas to userRouter 
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);