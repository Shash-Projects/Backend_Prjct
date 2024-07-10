//By using asyncWrapper, we avoid having to manually wrap each 
//function with try-catch blocks and ensure consistent err handling thruout our application.

const ayncWrapper =(func)=>{
    return (req, res, next)=>{
        Promise.resolve(func(req, res, next))
        .catch((err) => next(err))
    }
};