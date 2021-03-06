type SessionData = {
    token: string,
    id: string,
    type: string,
    privilege: number,          // 0 if user is a student
}

declare namespace Express {
    export interface Request {
        sessionData?: SessionData
        component?: number
    }
}