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

// The allowance rules of a leave type (backend: models/LeaveType.js).
export const ALLOWANCE_RULE_LABELS = {
  per_year: 'Per year',
  once_per_employment: 'Once per employment',
  no_limit: 'No fixed limit',
}

// The allowance of a leave type as text, e.g. "14 days per year",
// "120 days once per employment" or "No fixed limit".
export function allowanceText(leaveType) {
  if (leaveType.allowanceRule === 'no_limit') {
    return 'No fixed limit'
  }
  let dayWord = ' days'
  if (leaveType.allowanceDays === 1) {
    dayWord = ' day'
  }
  if (leaveType.allowanceRule === 'per_year') {
    return leaveType.allowanceDays + dayWord + ' per year'
  }
  return leaveType.allowanceDays + dayWord + ' once per employment'
}

// "Paid" or "Unpaid". isPaid is null for old leave requests without a leave type.
export function paidText(isPaid) {
  if (isPaid === true) {
    return 'Paid'
  }
  if (isPaid === false) {
    return 'Unpaid'
  }
  return ''
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

// Number of WORKING days from start to end, both included: weekend days
// (0 = Sunday ... 6 = Saturday) and holiday dates are not counted.
// This is a copy of the backend's countWorkingDays (utils/workDate.js), written the
// same way. The form uses it to show the number while the employee types; the
// backend counts again when the request is sent, and its number is the one saved.
export function countWorkingDays(startDate, endDate, weekendDays, holidayDates) {
  // While a date is still empty, or the last day is before the first day,
  // there is nothing to count yet. (countDays gives null in those cases.)
  if (countDays(startDate, endDate) === null) {
    return null
  }

  // One day in milliseconds (24 hours x 60 minutes x 60 seconds x 1000).
  const DAY_MS = 24 * 60 * 60 * 1000

  // The first and last day in milliseconds at midnight UTC ("Z"), so the
  // browser's time zone can never move a date to the day before or after.
  let current = Date.parse(startDate + 'T00:00:00.000Z')
  const end = Date.parse(endDate + 'T00:00:00.000Z')
  let workingDays = 0

  // Look at every day of the period, one after the other.
  while (current <= end) {
    const day = new Date(current)
    // The weekday number of this day: 0 = Sunday ... 6 = Saturday.
    const weekday = day.getUTCDay()
    // The same day as text, e.g. "2026-12-16" (the first 10 characters of toISOString()).
    const dateText = day.toISOString().slice(0, 10)

    // A day is a "day off" when it is a weekend day OR a holiday.
    let isDayOff = false
    if (weekendDays.includes(weekday)) {
      isDayOff = true
    }
    if (holidayDates.includes(dateText)) {
      isDayOff = true
    }
    // Only days that are not days off are counted.
    if (!isDayOff) {
      workingDays = workingDays + 1
    }

    // Move on to the next day.
    current = current + DAY_MS
  }
  return workingDays
}

// Short text for an activity entry's action key, e.g. "employee.create" → "Employee create".
export function activityLabel(action) {
  if (!action) {
    return ''
  }
  const text = action.replace(/[._]/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
