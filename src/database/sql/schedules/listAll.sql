SELECT
    sched.id,
    sched.professor_id,
    prof.first_name AS professor_first_name,
    prof.middle_name AS professor_middle_name,
    prof.last_name AS professor_last_name,
    sched.subject_id,
    subj.name AS subject_name,
    subj.code as subject_code,
    subj.unit_lec AS subject_unit_lec,
    subj.unit_lab AS subject_unit_lab,
    sched.room,
    sched.class,
    sched.capacity,
    sched.time_start,
    sched.time_duration,
    sched.days,
    sched.is_hidden,
    sched.created_at,
    sched.updated_at
FROM schedules sched
INNER JOIN subjects subj ON sched.subject_id = subj.id
INNER JOIN professors prof ON sched.professor_id = prof.id
WHERE sched.is_hidden = false
ORDER BY sched.created_at DESC
LIMIT ${limit}
OFFSET ${offset}
;