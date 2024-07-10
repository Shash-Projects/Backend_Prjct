import dotenv from "dotenv";   // package loads environment variables from ".env" file to "process.env"
import { connectDB } from "./db/index.js";
import {app} from "./app.js";

dotenv.config({
    path: './env'
})

connectDB() //async func returns promise
.then(()=>{

    // This listens for Error in connecting Express to DB
    app.on("Error in connecting Express to DB", (err)=>{
        console.log(err);
    })

    const workingPort = process.env.PORT || 3000;
    app.listen(workingPort, ()=>{
        console.log(`Server running at PORT: ${workingPort}`)
    })
})
.catch((err)=>{
    console.log("Error in loading DB", err)
})