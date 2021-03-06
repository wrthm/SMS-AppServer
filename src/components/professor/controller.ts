import DatabaseService from '../../database'
import { checkIfNull, propTrimOrNull } from '../../utils/validationUtils'
import { NextFunction, Request, Response } from 'express'
import { professors as professor} from '../../database/models'
import { search_name_args } from '../../database/modelsCustom'
import { InvalidArgumentException, NotFoundException } from '../../exceptions'

const Controller = {
    find: async (req: Request, res: Response, next: NextFunction) => {
        let result: professor | professor[] | null
        let { id, name } = req.params
        let { fname, mname, lname, ...paginationArgs } = req.query
        try {
            if (id) {
                result = await DatabaseService.professors.findByID(id)
            } else if (name) {
                let searchArgs: search_name_args
                searchArgs = {fname: `%${name}%`, mname: `%${name}%`, lname: `%${name}%`}
                result = await DatabaseService.professors.findByNameOR(searchArgs, paginationArgs)
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
                result = await DatabaseService.professors.findByNameAND(searchArgs, paginationArgs)
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
            const result = await DatabaseService.professors.listAll(req.query, req.query.dept as string | undefined)
            return res.send(result)
        }
        catch (err) {
            next(err)
        }
    },
    add: async (req: Request, res: Response, next: NextFunction) => {
        const data: professor = req.body
        data.first_name = data.first_name.trim()
        data.middle_name = data.middle_name.trim()
        data.last_name = data.last_name.trim()
        data.phone_number = propTrimOrNull(data.phone_number)
        try {
            let result = await DatabaseService.professors.add(data)
            res.statusCode = 201
            return res.send({"code": 201, "message": "Entry added successfully", "id": result.id})
        }
        catch (err) {
            next(err)
        }
        
    },
    update: async (req: Request, res: Response, next: NextFunction) => {
        const data: professor = req.body
        data.first_name = data.first_name.trim()
        data.middle_name = data.middle_name.trim()
        data.last_name = data.last_name.trim()
        data.phone_number = propTrimOrNull(data.phone_number)
        try {
            if ((await DatabaseService.professors.update(data)).rowCount !== 0) {
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
            if ((await DatabaseService.professors.delete(id)).rowCount !== 0) {
                return res.send({"code": 200,"message": "Entry deleted successfully"})
            }
            else {
                return next(new NotFoundException('Entry does not exist'))
            }
        } catch (err) {
            next(err)
        }
    }
}



export { Controller as ProfessorController }