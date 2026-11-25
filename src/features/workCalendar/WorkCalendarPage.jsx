// Work calendar page (GET and PUT /api/work-calendar, Super Admin only).
// The company's weekly weekend days and holidays. Leave requests count only the
// other days (working days), and employees cannot request leave until this page
// has been saved at least once.
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingBlock } from '@/components/QueryState'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { normalizeError } from '@/lib/apiError'
import { formatDate } from '@/lib/format'
import { useGetWorkCalendarQuery, useSaveWorkCalendarMutation } from './workCalendarApi'

// The days of the week; the position is the day number the backend uses (0 = Sunday).
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function CalendarForm({ calendar }) {
  const [saveCalendar, saveState] = useSaveWorkCalendarMutation()
  // The calendar being edited. Nothing is saved until "Save calendar" is pressed.
  const [weekendDays, setWeekendDays] = useState(calendar.weekendDays)
  const [holidays, setHolidays] = useState(calendar.holidays)
  // The "add holiday" inputs.
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')
  const [holidayError, setHolidayError] = useState(null)
  const [formError, setFormError] = useState(null)

  // Ticks or unticks one weekday as a weekend day.
  // React state must not be changed directly, so we always build a NEW list and
  // give it to setWeekendDays; React then draws the checkboxes again.
  function toggleWeekday(day) {
    if (weekendDays.includes(day)) {
      // It was ticked: the new list is every day except this one.
      const remaining = []
      for (const weekendDay of weekendDays) {
        if (weekendDay !== day) {
          remaining.push(weekendDay)
        }
      }
      setWeekendDays(remaining)
    } else {
      // It was not ticked: the new list is all the old days plus this one.
      // [...weekendDays, day] means "a new list with everything in weekendDays, and day at the end".
      setWeekendDays([...weekendDays, day])
    }
  }

  // Adds the holiday from the inputs to the list (sorted by date).
  function addHoliday() {
    setHolidayError(null)
    if (!newDate) {
      setHolidayError('Choose the holiday date.')
      return
    }
    if (newName.trim() === '') {
      setHolidayError('Enter the holiday name.')
      return
    }
    for (const holiday of holidays) {
      if (holiday.date === newDate) {
        setHolidayError(formatDate(newDate) + ' is already a holiday.')
        return
      }
    }
    // A new list: all old holidays plus the new one (React state is never changed directly).
    const updated = [...holidays, { date: newDate, name: newName.trim() }]
    // Sort by date. Dates written as "YYYY-MM-DD" are in the right order when compared
    // as text; localeCompare gives a negative number when first comes before second.
    updated.sort(function (first, second) {
      return first.date.localeCompare(second.date)
    })
    setHolidays(updated)
    setNewDate('')
    setNewName('')
  }

  // Removes one holiday from the list: the new list is every holiday except this date.
  function removeHoliday(date) {
    const remaining = []
    for (const holiday of holidays) {
      if (holiday.date !== date) {
        remaining.push(holiday)
      }
    }
    setHolidays(remaining)
  }

  // Sends the whole calendar to the backend.
  async function save() {
    setFormError(null)
    if (weekendDays.length === 7) {
      setFormError('At least one day of the week must be a working day.')
      return
    }
    try {
      // .unwrap() turns an error answer from the backend into an error for the catch block.
      await saveCalendar({ weekendDays: weekendDays, holidays: holidays }).unwrap()
      toast.success('Work calendar saved', { description: 'Leave requests now count only working days.' })
    } catch (error) {
      // Show the backend's first field message (e.g. "2026-05-01 is listed twice"),
      // or its general message.
      const problem = normalizeError(error)
      let message = problem.message
      // Object.values gives the messages of the field errors as a list,
      // e.g. { holidays: "2026-05-01 is listed twice" } -> ["2026-05-01 is listed twice"].
      const fieldMessages = Object.values(problem.fieldErrors)
      if (fieldMessages.length > 0) {
        message = fieldMessages[0]
      }
      setFormError(message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!calendar.configured ? (
        <Alert variant="warning">The work calendar has not been set up yet. Employees cannot request leave until you save it.</Alert>
      ) : null}
      {formError ? <Alert variant="danger">{formError}</Alert> : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Weekly weekend days</CardTitle>
            <CardDescription>Tick the days the company does not work every week. Leave the box empty if the company works every day.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-3">
          {WEEKDAYS.map((name, day) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" checked={weekendDays.includes(day)} onChange={() => toggleWeekday(day)} />
              {name}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Company holidays</CardTitle>
            <CardDescription>Holidays are not counted as leave days.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <FormField id="holiday-date" label="Date">
              <Input id="holiday-date" type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
            </FormField>
            <FormField id="holiday-name" label="Holiday name">
              <Input id="holiday-name" maxLength={100} placeholder="e.g. Victory Day" value={newName} onChange={(event) => setNewName(event.target.value)} />
            </FormField>
            <Button variant="outline" onClick={addHoliday}>
              <PlusIcon aria-hidden="true" />
              Add holiday
            </Button>
          </div>
          {holidayError ? <p className="text-xs text-danger">{holidayError}</p> : null}

          {holidays.length === 0 ? <p className="text-sm text-muted-foreground">No holidays added.</p> : null}
          <ul className="divide-y">
            {holidays.map((holiday) => (
              <li key={holiday.date} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">
                  <span className="font-medium tabular-nums">{formatDate(holiday.date)}</span> · {holiday.name}
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeHoliday(holiday.date)} aria-label={'Remove ' + holiday.name}>
                  <Trash2Icon aria-hidden="true" />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saveState.isLoading}>
          {saveState.isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          Save calendar
        </Button>
      </div>
    </div>
  )
}

export default function WorkCalendarPage() {
  const calendar = useGetWorkCalendarQuery()

  let content
  if (calendar.isLoading) {
    content = <LoadingBlock />
  } else if (calendar.isError) {
    content = <ErrorState error={calendar.error} onRetry={calendar.refetch} />
  } else {
    // The form keeps its own copy of the calendar while you edit it (useState).
    // After Save, the backend sends a new updatedAt time. A different "key" makes
    // React throw the old form away and start a NEW one with the saved values.
    // Before the very first save there is no updatedAt yet, so the key is "new".
    content = <CalendarForm key={calendar.data.updatedAt || 'new'} calendar={calendar.data} />
  }

  return (
    <>
      <PageHeader title="Work Calendar" description="Weekend days and company holidays. Leave is counted in working days only." />
      {content}
    </>
  )
}
