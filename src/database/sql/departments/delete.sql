UPDATE departments
SET is_hidden = true
WHERE id = ${id} AND is_hidden = false

;