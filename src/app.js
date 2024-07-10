import express from 'express';
import cors from 'cors';

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
app.use(express.static("pulblic")) 