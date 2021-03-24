import { Joi } from 'express-validation'

export const CourseValidator = {
    model: {
        body: Joi.object({
                       id: Joi.string()
                              .uuid()
                              .required(),
            department_id: Joi.string()
                              .uuid()
                              .required(),
                     name: Joi.string()
                              .required(),
                is_hidden: Joi.bool(),
        })
    },
    postModel: {
        body: Joi.object({
            department_id: Joi.string()
                              .uuid()
                              .required(),
                     name: Joi.string()
                              .required(),
        })
    }
}