SELECT 
    e.id,
    e.reg_num,
    e.academic_term_id,
    a_t.name AS academic_term_name,
    e.student_id,
    s.first_name AS student_first_name,
    s.middle_name AS student_middle_name,
    s.last_name AS student_last_name,
    e.course_schedule_id,
    c_s.name AS course_schedule_name,
    c_s.year_level AS course_schedule_year_level,
    c.name AS course_name,
    d.id AS department_id,
    d.name AS department_name,
    e.status,
    e.is_revoked,
    e.created_at,
    e.updated_at
FROM enrollments_view e
INNER JOIN academic_terms a_t ON e.academic_term_id = a_t.id
INNER JOIN students s ON e.student_id = s.id
INNER JOIN course_schedules c_s ON e.course_schedule_id = c_s.id
INNER JOIN courses c ON c_s.course_id = c.id
INNER JOIN departments d ON c.department_id = d.id
WHERE e.is_revoked = false
ORDER BY e.created_at DESC
LIMIT ${limit}
OFFSET ${offset}
;