SELECT
    cs.id,
    cs.course_id,
    c.name as course_name,
    cs.academic_term_id,
    a.name as academic_term_name,
    cs.name,
    cs.year_level,
    cs.is_hidden,
    cs.created_at,
    cs.updated_at
FROM course_schedules cs
INNER JOIN courses c ON cs.course_id = c.id
INNER JOIN academic_terms a ON cs.academic_term_id = a.id
WHERE cs.is_hidden = false AND cs.course_id = ${course} AND cs.academic_term_id = ${term}
ORDER BY cs.created_at DESC
LIMIT ${limit}
OFFSET ${offset}
;