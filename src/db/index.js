import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

// ifis => it executes the function at its declaration
//;(function inside)()

export const connectDB = async()=>{  
    try {
        // connecting to database 
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected!! DB_HOST: ${connectionInstance.connection.host}`)

    } catch (error) {
        console.error("Failure connecting to DB \n", error);
        process.exit(1);
    }
}