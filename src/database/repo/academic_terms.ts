import { IDatabase, IMain, QueryFile } from "pg-promise";
import { academic_terms as AcademicTerms } from '../models'
import { academic_term as sql, common} from '../sql'

export class AcademicTermsRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {

    }

    async findByID(id: string): Promise<AcademicTerms | null> {
      return await this.db.oneOrNone(common.findByID, {tableName: 'academic_terms', id})
    }

    async findByName(name: string): Promise<AcademicTerms[] | null> {
      return await this.db.manyOrNone(sql.findByName, {name})
    }
    
    async add(data: AcademicTerms) {
      return await this.db.one(sql.add, data)
    }

    async update(data: AcademicTerms) {
      return await this.db.result(sql.update, data)
    }

    async delete(id: String) {
      return await this.db.result(sql.delete, {id})
    }
}