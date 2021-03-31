import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validation';
import { APIException } from '../exceptions/'
import { logger } from '../utils/logger'

// TODO: separate logging and response to different middlewares
export const errorHandler = (err: any, req:Request, res:Response, next:NextFunction) => {
    if(err instanceof ValidationError) {
        const details = err.details.body || err.details.params || err.details.query
        const message: string = typeof details !== 'undefined' ? details[0].message : err.message

        // logger.error(`${message} (${req.originalUrl})`)

        return res.status(err.statusCode).send(
        {
            "code": err.statusCode,
            "message": message
        })
    }

    const foreignKeyCheck = err.message.match(/(?<=violates foreign key constraint )(".+?")/)
    if (foreignKeyCheck) {
        err.status = 400
        err.message = `The entered foreign key ID(s) did not match any existing entry, thus violating the foreign key ${foreignKeyCheck[0]}.`
    }

    const code = err.status || 500
    const message = (code !== 500) ? err.message : 'An error has occured in the server'
    if (!(err instanceof APIException) && code !== 400)
        process.env.NODE_ENV === 'development' && err.stack ? logger.error(err.stack) : logger.error(err)
    res.status(code).send({
        code,
        message,
    })
}