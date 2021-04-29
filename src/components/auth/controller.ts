import AuthService from '../../database/indexAuth'
import DatabaseService from '../../database/index'
import { checkIfNull } from '../../utils/validationUtils'
import { NextFunction, Request, Response } from 'express'
import { students_credentials } from '../../database/modelsAuth'
import { students_credentials_put as student_credential_put } from '../../database/modelsCustom'
import { InvalidArgumentException, NotFoundException, NotImplementedException } from '../../exceptions'
import { hash, compare } from 'bcrypt'
import { AppServerConfig } from '../../config'
import { DateTime } from 'luxon'
import uid from 'uid-safe'

const loginStudent = async (req: Request, res: Response, next: NextFunction) => {
    const credential = req.body
    try {
        const student: students_credentials = await AuthService.students_credentials.findByUsername(credential.username)
        if (student) {
            if (await compare(credential.password, student.password)) {
                // TODO: move session creation routine to a separate function
                const session_token = await uid(24)
                const expiry_date = DateTime.now().plus({days: 7}).toISO()
                // routine to create session on db goes here...
                const data = {
                    'id': student.student_id,
                    'session-token': session_token,
                    'expiration-date': expiry_date,
                }
                return res.send(data)
            }
        } else {
            console.log('lol')
        }
        next(new InvalidArgumentException('Wrong username or password'))
    } catch (err) {
        next(err)
    }
    
}

const Controller = {
    // login dispatcher
    loginDispatcher: async (req: Request, res: Response, next: NextFunction) => {
        return loginStudent(req, res, next)
    },

    // login routine for student

    // login routine for faculty



    nope: async (req: Request, res: Response, next: NextFunction) => {
        next(new NotImplementedException())
    },

    update_student_cred: async (req: Request, res: Response, next: NextFunction) => {
        const student: student_credential_put = req.body
        try {
            // check first if student exists in main db
            const studentExists = await DatabaseService.common.exists(student.student_id, 'students')

            if (!studentExists.exists) {
                return next(new NotFoundException('Student not found'))
            }

            if (!student.username) {
                student.username = null
            }

            // hash the password first if supplied
            if (student.password) {
                student.password = await hash(student.password, AppServerConfig.BcryptSaltRounds)
            } else {
                student.password = null
            }
            const result = await AuthService.students_credentials.updateOrAdd(student)
            if (result.success) {
                res.send({"code": 200, "message": `Operation completed successfully. (${result.message})`})
            } else {
                next(new InvalidArgumentException(result.message))
            }
        }
        catch (err) {
            if (err?.message.includes('unique_student_username')) {
                next(new InvalidArgumentException('Username already exists'))
            } else {
                next(err)
            }
        }
        
    },
}



export { Controller as AuthController }