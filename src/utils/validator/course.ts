import { Joi } from 'express-validation'

const postModel = {
    body: Joi.object({
        department_id: Joi.string()
                          .uuid()
                          .required(),
                 name: Joi.string()
                          .trim()
                          .max(60)
                          .required(),
    })
}

const model = {
    body: postModel.body.append({
               id: Joi.string()
                      .uuid()
                      .required(),
        is_hidden: Joi.bool(),
    })
}


export const CourseValidator = { postModel, model }