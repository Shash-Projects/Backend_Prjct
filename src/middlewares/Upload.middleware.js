import multer from 'multer';

//The function will return the localFilePath
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        // specify where u want data to be stored
        cb(null, "./public/storehouse")
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

export const upload= multer({
    storage: storage
})