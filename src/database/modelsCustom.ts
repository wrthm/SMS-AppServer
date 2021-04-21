export interface pagination_args {
    "page"?: number
    "limit"?: number
}
export interface search_name_args {
    "fname"?: string,
    "mname"?: string,
    "lname"?: string,
}

export interface search_schedule_args {
    "s_name"?: string,
    "p_fname"?: string,
    "p_mname"?: string,
    "p_lname"?: string,
    "room"?: string,
    "class"?: string,
    [index: string] : any
}

export interface search_course_schedule_args {
    "name"?: string,
    "c_name"?: string,
    "a_name"?: string,
    [index: string] : any
}

export interface schedules_external {
    "id"?: string 
    "professor_id": string 
    "subject_id": string 
    "unit_type": string 
    "room": string 
    "class": string 
    "capacity": number 
    "time_start": string
    "time_duration": string
    "days": number | string[]
    "is_hidden"?: boolean 
    "created_at"?: any 
    "updated_at"?: any 
  }