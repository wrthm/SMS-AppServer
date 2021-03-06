import DatabaseService from '../../database'
import { checkIfNull, propTrimOrNull } from '../../utils/validationUtils'
import { NextFunction, Request, Response } from 'express'
import { students as student} from '../../database/models'
import { search_name_args } from '../../database/modelsCustom'
import { InvalidArgumentException, NotFoundException } from '../../exceptions'
import AuthService from '../../database/indexAuth'

const Controller = {
    find: async (req: Request, res: Response, next: NextFunction) => {
        let result: student | student[] | null
        let { id, name } = req.params
        let { fname, mname, lname, ...paginationArgs } = req.query
        try {
            if (id) {
                result = await DatabaseService.students.findByID(id)
            } else if (name) {
                let searchArgs: search_name_args
                searchArgs = {fname: `%${name}%`, mname: `%${name}%`, lname: `%${name}%`}
                result = await DatabaseService.students.findByNameOR(searchArgs, paginationArgs)
            } else if (fname || mname || lname) {
                if (fname) {
                    fname = `%${fname}%`
                } else {
                    fname = '%'
                }
                if (mname) {
                    mname = `%${mname}%`
                } else {
                    mname = '%'
                }
                if (lname) {
                    lname = `%${lname}%`
                } else {
                    lname = '%'
                }
                let searchArgs: search_name_args = {
                    fname: fname as string, 
                    mname: mname as string,
                    lname: lname as string,
                }
                result = await DatabaseService.students.findByNameAND(searchArgs, paginationArgs)
            }
            else {
                return next(new InvalidArgumentException())
            }
            checkIfNull(result)
            return res.send(result)
        }
        catch (err) {
            next(err)
        }
    },
    findAll: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await DatabaseService.common.listAll(req.query, 'students_fix')
            return res.send(result)
        }
        catch (err) {
            next(err)
        }
    },
    add: async (req: Request, res: Response, next: NextFunction) => {
        const data: student = req.body
        trimStudent(data)
        try {
            let result = await DatabaseService.students.add(data)
            res.statusCode = 201
            return res.send({"code": 201, "message": "Entry added successfully", "id": result.id})
        }
        catch (err) {
            next(err)
        }
        
    },
    update: async (req: Request, res: Response, next: NextFunction) => {
        const data: student = req.body
        trimStudent(data)
        try {
            if ((await DatabaseService.students.update(data)).rowCount !== 0) {
                return res.send({"code": 200,"message": "Entry updated successfully"})
            }
            else {
                return next(new NotFoundException('Entry does not exist'))
            }
            
        } catch (err) {
            next(err)
        }
    },
    delete: async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        try {
            if ((await DatabaseService.students.delete(id)).rowCount !== 0) {
                return res.send({"code": 200,"message": "Entry deleted successfully"})
            }
            else {
                return next(new NotFoundException('Entry does not exist'))
            }
        } catch (err) {
            next(err)
        }
    },
    getUsername: async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        try {
            if ((await DatabaseService.common.exists(id, 'students')).exists) {
                const result = await AuthService.students_credentials.getUsername(id)
                if (result) {
                    res.send(result)
                } else {
                    res.send({username: null})
                }
            } else {
                next(new NotFoundException('Entry does not exist'))
            }
        } catch (err) {
            next(err)
        }
    },
    hasEnrollments: async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        try {
            if ((await DatabaseService.common.exists(id, 'students')).exists) {
                const result = await DatabaseService.enrollments.studentHasEnrollments(id)
                res.send(result)
            } else {
                next(new NotFoundException('Entry does not exist'))
            }
        } catch (err) {
            next(err)
        }
    },
}

const trimStudent = (data: student) => {
    data.school_id = propTrimOrNull(data.school_id)
    data.first_name = data.first_name.trim()
    data.middle_name = data.middle_name.trim()
    data.last_name = data.last_name.trim()
    data.a_street = data.a_street.trim()
    data.a_barangay = data.a_barangay.trim()
    data.a_city = data.a_city.trim()
    data.a_province = data.a_province.trim()
    data.sex = data.sex.trim()
    data.email_address = propTrimOrNull(data.email_address)
    data.phone_number = propTrimOrNull(data.phone_number)
}

export { Controller as StudentController }