class HandleError extends Error{
    constructor(
        statusCode,
        message="Something wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data= null;
        this.success = false; //do not want to handle success
        this.errors = errors;
        this,message= message;

        // Code provides stack trace for easier debugging
        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }

}
export {HandleError};