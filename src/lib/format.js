// Display helpers. Labels match the backend's allowed values exactly.

export const EMPLOYMENT_TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  intern: 'Intern',
}

export const EMPLOYMENT_STATUS_LABELS = {
  active: 'Active',
  on_leave: 'On leave',
  resigned: 'Resigned',
  terminated: 'Terminated',
}

export const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
}

export const LEAVE_TYPE_LABELS = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  unpaid: 'Unpaid',
  other: 'Other',
}

export const LEAVE_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export function labelFor(labels, value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return labels[value] || value
}

export function fullName(person) {
  if (!person) {
    return ''
  }
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}

// An employee's department or designation ({ id, name, isActive } or null) as text.
// null gives '' (shown as "—" by DetailList).
export function assignmentName(item) {
  if (!item) {
    return ''
  }
  if (!item.isActive) {
    return item.name + ' (inactive)'
  }
  return item.name
}

export function initials(person) {
  if (!person) {
    return '?'
  }
  const first = (person.firstName || '').charAt(0)
  const last = (person.lastName || '').charAt(0)
  return (first + last).toUpperCase() || '?'
}

// Calendar dates (joining date, date of birth) are stored at midnight UTC, and
// leave/attendance days are "YYYY-MM-DD" text. Format them in UTC so they never
// shift by a day in the viewer's time zone.
export function formatDate(value) {
  if (!value) {
    return '—'
  }
  const text = String(value)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(text + 'T00:00:00.000Z') : new Date(text)
  if (isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

// Moments in time (clock-in, last login, activity) in the viewer's time zone.
export function formatDateTime(value) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(value) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) {
    return '—'
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) {
    return rest + ' min'
  }
  return hours + ' h ' + String(rest).padStart(2, '0') + ' min'
}

// "YYYY-MM-DD" for a stored calendar date (for <input type="date">).
export function toDateInput(value) {
  if (!value) {
    return ''
  }
  return String(value).slice(0, 10)
}

// <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm") in the viewer's time zone.
export function toDateTimeInput(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return ''
  }
  const pad = (n) => String(n).padStart(2, '0')
  return (
    date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes())
  )
}

// Number of calendar days from start to end, both included (same rule as the backend).
export function countDays(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) {
    return null
  }
  const start = new Date(startDate + 'T00:00:00.000Z').getTime()
  const end = new Date(endDate + 'T00:00:00.000Z').getTime()
  if (isNaN(start) || isNaN(end) || end < start) {
    return null
  }
  return Math.round((end - start) / 86400000) + 1
}

// Short text for an activity entry's action key, e.g. "employee.create" → "Employee create".
export function activityLabel(action) {
  if (!action) {
    return ''
  }
  const text = action.replace(/[._]/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
