import AuthService from '../../database/indexAuth'
import DatabaseService from '../../database/index'
import { checkIfNull } from '../../utils/validationUtils'
import { NextFunction, Request, Response } from 'express'
import { students_credentials as student_credentials, sessions, faculties as faculty, faculties } from '../../database/modelsAuth'
import { students_credentials_put as student_credential_put, update_password, faculties_external as faculty_external } from '../../database/modelsCustom'
import { InvalidArgumentException, NotFoundException, NotImplementedException, UnauthorizedException } from '../../exceptions'
import { systemComponentBits } from '../../utils/authConstants'
import { hash, compare } from 'bcrypt'
import { AppServerConfig } from '../../config'
import { DateTime } from 'luxon'
import uid from 'uid-safe'
import { FacultyGetPassword } from '../../database/repo/faculties'
import { decodePrivilege } from '../../utils/parseFaculty'

const loginStudent = async (req: Request, res: Response, next: NextFunction) => {
    const credential = req.body
    try {
        const student: student_credentials = await AuthService.students_credentials.findByUsername(credential.username)
        if (student) {
            if (await compare(credential.password, student.password)) {
                const user_agent = (req.headers['user-agent']) ? req.headers['user-agent'] : null
                const session: sessions = {
                    session_token: await uid(24),
                    ip_address: req.clientIp,
                    user_agent: user_agent,
                    type: 'student',
                    id: student.student_id,
                    expiration_date: DateTime.now().plus({days: 7}).toISO()
                }
                await AuthService.sessions.create(session)
                const dataOut = {
                    'id': student.student_id,
                    'session-token': session.session_token,
                    'expiration-date': session.expiration_date,
                }
                return res.send(dataOut)
            }
        }
        next(new InvalidArgumentException('Wrong username or password'))
    } catch (err) {
        next(err)
    }
    
}

const loginFaculty = async (req: Request, res: Response, next: NextFunction) => {
    const credential = req.body
    try {
        const faculty: faculties | null = await AuthService.faculties.findByUsername(credential.username)
        if (faculty) {
            if (await compare(credential.password, faculty.password)) {
                const user_agent = (req.headers['user-agent']) ? req.headers['user-agent'] : null
                const session: sessions = {
                    session_token: await uid(24),
                    ip_address: req.clientIp,
                    user_agent: user_agent,
                    type: 'faculty',
                    id: faculty.id as string,
                    expiration_date: DateTime.now().plus({days: 7}).toISO()
                }
                await AuthService.sessions.create(session)
                const dataOut = {
                    'id': faculty.id as string,
                    'session-token': session.session_token,
                    'expiration-date': session.expiration_date,
                }
                return res.send(dataOut)
            }
        }
        next(new InvalidArgumentException('Wrong username or password'))
    } catch (err) {
        next(err)
    }
}

const Controller = {
    loginDispatcher: async (req: Request, res: Response, next: NextFunction) => {
        if (req?.component === systemComponentBits.StudentCenter) {
            return loginStudent(req, res, next)
        } else {
            return loginFaculty(req, res, next)
        }
        
    },

    logout: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token: string | undefined = req.sessionData?.token
            if (token) {
                await AuthService.sessions.revoke(token)
                res.send({"code": 200, "message": "User logged out successfully"})
            }
        } catch (err) {
            next(err)
        }
    },

    whoAmI: async (req: Request, res: Response, next: NextFunction) => {
        try {
            switch (req.sessionData?.type.toLowerCase()) {
                case 'student':
                    const studentPromise = DatabaseService.students.findByID(req.sessionData.id)
                    const usernamePromise = AuthService.students_credentials.getUsername(req.sessionData.id)
                    const student = await studentPromise
                    const username = await usernamePromise
                    return res.send({...student, username: username.username})
                case 'faculty':
                    const faculty: faculty_external | null = await AuthService.faculties.findByID(req.sessionData.id)
                    if (faculty) {
                        faculty.privilege = decodePrivilege((faculty as faculty_external).privilege as number)
                    }
                    return res.send(faculty)
            }

            next(new UnauthorizedException())
        } catch (err) {
            next(err)
        }
    },

    update_password: async (req: Request, res: Response, next: NextFunction) => {
        const pw: update_password = req.body

        let user: student_credentials | FacultyGetPassword | null
        switch (req?.sessionData?.type) {
            case 'student':
                user = await AuthService.students_credentials.findByStudentID(req.sessionData.id)
                break
            case 'faculty':
                user = await AuthService.faculties.getPassword(req.sessionData.id)
                break
            default:
                return next(new UnauthorizedException())
        }
        if (user) {
            if (await compare(pw.currentPassword, user.password)) {
                pw.newPassword = await hash(pw.newPassword, AppServerConfig.BcryptSaltRounds)
                const result = req?.sessionData.type === 'student' ? await AuthService.students_credentials.updatePasswordOnly(req.sessionData.id, pw.newPassword) :
                               req?.sessionData.type === 'faculty' ? await AuthService.faculties.updatePasswordOnly({id: req.sessionData.id, password: pw.newPassword}) : null

                if (result !== null) {
                    return res.send({"code": 200, "message": "Password updated successfully"})
                } else {
                    return next(new UnauthorizedException())
                }
            } else {
                return next(new InvalidArgumentException("Invalid current password"))
            }
        } else {
            return next(new UnauthorizedException("Unauthorized: User account (linked to the session token) was not found on the system"))
        }
    },

    update_student_cred: async (req: Request, res: Response, next: NextFunction) => {
        const student: student_credential_put = req.body
        try {
            // check first if student exists in main db
            const studentExists = DatabaseService.common.exists(student.student_id, 'students')
            const studentHasEnrollments = DatabaseService.enrollments.studentHasEnrollments(student.student_id)
            if (!(await studentExists).exists) {
                return next(new NotFoundException('Student not found'))
            } else if (!(await studentHasEnrollments).result) {
                return next(new InvalidArgumentException('Student must enroll first before creating his/her Student Center account'))
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
            if (err instanceof Error && err.message.includes('unique_student_username')) {
                next(new InvalidArgumentException('Username already exists'))
            } else {
                next(err)
            }
        }
    },
}

export { Controller as AuthController }