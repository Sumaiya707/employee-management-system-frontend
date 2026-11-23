// Form rules that mirror the backend validators (backend: validators/*.js and
// utils/password.js). The backend checks everything again; these rules only
// give the user faster feedback.
import { z } from 'zod'

// Same checks as getPasswordProblems() in the backend.
export function passwordProblems(password) {
  const problems = []
  if (typeof password !== 'string' || password.length < 12) problems.push('at least 12 characters')
  if (!/[a-z]/.test(password || '')) problems.push('a lowercase letter')
  if (!/[A-Z]/.test(password || '')) problems.push('an uppercase letter')
  if (!/[0-9]/.test(password || '')) problems.push('a number')
  if (!/[^A-Za-z0-9]/.test(password || '')) problems.push('a symbol')
  return problems
}

export const PASSWORD_HINT = 'At least 12 characters with upper and lower case letters, a number and a symbol.'

export const strongPassword = z
  .string()
  .max(128, 'Password is too long')
  .superRefine((value, ctx) => {
    const problems = passwordProblems(value)
    if (problems.length > 0) {
      ctx.addIssue({ code: 'custom', message: 'Password needs ' + problems.join(', ') })
    }
  })

export const emailField = z.string().trim().min(1, 'Email is required').max(254, 'Email is too long').email('Email is not valid')

export function nameField(label) {
  return z
    .string()
    .trim()
    .min(1, label + ' is required')
    .max(50, label + ' must be at most 50 characters')
}

const phonePattern = /^[0-9+()\-\s]*$/
const phoneMessage = 'Phone may contain only numbers, spaces and + ( ) -'

export const requiredPhone = z.string().trim().min(1, 'Phone is required').max(30, 'Phone must be at most 30 characters').regex(phonePattern, phoneMessage)

export const optionalPhone = z.string().trim().max(30, 'Phone must be at most 30 characters').regex(phonePattern, phoneMessage)

export const addressField = z.string().trim().max(300, 'Address must be at most 300 characters')

export const emergencyContactField = z.object({
  name: z.string().trim().max(100, 'Name must be at most 100 characters'),
  phone: optionalPhone,
  relationship: z.string().trim().max(50, 'Relationship must be at most 50 characters'),
})

function isRealDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const date = new Date(text + 'T00:00:00.000Z')
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text
}

export function requiredDate(label) {
  return z
    .string()
    .min(1, label + ' is required')
    .refine(isRealDate, label + ' is not a real date')
}

// Empty text means "not set".
export const optionalPastDate = z
  .string()
  .refine((text) => text === '' || isRealDate(text), 'Date of birth is not a real date')
  .refine((text) => text === '' || new Date(text + 'T00:00:00.000Z').getTime() < Date.now(), 'Date of birth must be in the past')
