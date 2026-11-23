// Accessibility attributes that link an input to its label, hint and error
// (used together with <FormField>).
export function fieldA11y(id, error, hint) {
  const describedBy = []
  if (hint) describedBy.push(id + '-hint')
  if (error) describedBy.push(id + '-error')
  return {
    id: id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
  }
}

// Reads a nested React Hook Form error such as errors.emergencyContact.phone.
export function errorAt(errors, path) {
  let current = errors
  for (const part of path.split('.')) {
    if (!current) return undefined
    current = current[part]
  }
  return current && current.message ? current.message : undefined
}
