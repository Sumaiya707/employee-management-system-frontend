// Application name and wording in one place, so the brand can be changed later
// without searching through the pages. index.html has its own <title> and
// description (static HTML cannot import this file); keep them in step.
export const BRAND = {
  name: 'PeopleDesk',
  description: 'Employee Management System',
  portalName: 'Workplace Portal',
  loginHeadline: 'A better way to manage your people and workplace.',
  loginText: 'Manage employee information, attendance and leave requests in one organized place.',
  supportText: 'Need an account? Contact your administrator.',
}

// Browser tab title for a page, e.g. "Employees | PeopleDesk".
export function pageTitle(title) {
  if (!title) {
    return BRAND.name + ' | ' + BRAND.portalName
  }
  return title + ' | ' + BRAND.name
}
