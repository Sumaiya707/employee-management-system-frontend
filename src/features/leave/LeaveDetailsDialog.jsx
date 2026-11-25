import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DetailList } from '@/components/DetailList'
import { FormField } from '@/components/FormField'
import { LeaveStatusBadge } from '@/components/StatusBadges'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { normalizeError } from '@/lib/apiError'
import { balanceText, formatDate, formatDateTime, fullName, paidText } from '@/lib/format'
import { useCancelLeaveMutation, useGetLeaveBalancesQuery, useReviewLeaveMutation } from './leaveApi'

// One leave request with the actions the user may take on it:
//   canReview  approve / reject (leave:approve, organisation scope, not own)
//   canCancel  cancel own pending request (leave:request)
function Details({ leave, canReview, canCancel, onClose }) {
  const [review, reviewState] = useReviewLeaveMutation()
  const [cancel, cancelState] = useCancelLeaveMutation()
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const busy = reviewState.isLoading || cancelState.isLoading
  const pending = leave.status === 'pending'

  // HR: approve or reject the request. decision is "approved" or "rejected".
  async function submitReview(decision) {
    setActionError(null)
    setNoteError(null)
    const trimmed = note.trim()
    if (decision === 'rejected' && trimmed.length < 3) {
      setNoteError('A note is required when rejecting (at least 3 characters)')
      return
    }
    try {
      await review({ id: leave.id, decision: decision, note: trimmed }).unwrap()
      toast.success(decision === 'approved' ? 'Leave request approved' : 'Leave request rejected')
      onClose()
    } catch (error) {
      const problem = normalizeError(error)
      if (problem.fieldErrors.note) setNoteError(problem.fieldErrors.note)
      else setActionError(problem.message)
    }
  }

  // Employee: cancel their own pending request.
  async function cancelRequest() {
    setActionError(null)
    try {
      await cancel(leave.id).unwrap()
      toast.success('Leave request cancelled')
      onClose()
    } catch (error) {
      setActionError(normalizeError(error).message)
    }
  }

  const showReview = canReview && pending
  const showCancel = canCancel && pending

  // ---- The employee's balance, shown to the reviewer ----
  // The year of the request: the year of its first day ("2026-05-04" -> 2026).
  const leaveYear = Number(leave.startDate.slice(0, 4))
  let employeeId
  if (leave.employee) {
    employeeId = leave.employee.id
  }
  // Loaded only while the request can be reviewed AND its employee is known
  // (skip: true = do not load). Without an employeeId the backend would answer
  // with the reviewer's OWN balance, so in that case nothing is loaded.
  const balances = useGetLeaveBalancesQuery({ employeeId: employeeId, year: leaveYear }, { skip: !showReview || !employeeId })

  // The balance of this request's leave type, found by its code.
  // It is not found when the leave type is inactive or does not exist any more.
  let reviewBalance = null
  if (showReview && balances.data) {
    for (const row of balances.data.balances) {
      if (row.code === leave.leaveType) {
        reviewBalance = row
      }
    }
  }

  // The balance line, and a reason why Approve is blocked (or null).
  // This request is still pending, so its days are ALREADY inside pendingDays:
  // approving only moves them from pending to used. Approving is blocked when
  // approved + pending days are more than the current allowance, which shows as a
  // remaining balance below zero. (The backend checks the same rule again.)
  let balanceLine = null
  let approveProblem = null
  if (reviewBalance) {
    if (reviewBalance.allowanceRule === 'once_per_employment') {
      balanceLine = leave.leaveTypeName + ' balance for the whole employment: ' + balanceText(reviewBalance)
    } else {
      balanceLine = leave.leaveTypeName + ' balance in ' + leaveYear + ': ' + balanceText(reviewBalance)
    }
    if (reviewBalance.remainingDays !== null && reviewBalance.remainingDays < 0) {
      const totalDays = reviewBalance.approvedDays + reviewBalance.pendingDays
      const overDays = 0 - reviewBalance.remainingDays
      approveProblem =
        'This request cannot be approved: approved and pending days add up to ' + totalDays + ', which is ' + overDays +
        ' more than the current allowance of ' + reviewBalance.allowanceDays +
        '. You can reject this or another pending request, or ask the Super Admin to raise the allowance.'
    }
  }
  // The balances have loaded, but this leave type is not among them.
  const balanceMissing = showReview && Boolean(balances.data) && reviewBalance === null

  // Cancelling takes two clicks: "Cancel request", then "Yes, cancel request".
  const showCancelButton = showCancel && !confirmCancel
  const isConfirmingCancel = showCancel && confirmCancel

  // Which review button shows a spinner. RTK Query keeps the arguments of the
  // last review request in reviewState.originalArgs ({ id, decision, note }).
  let clickedDecision = null
  if (reviewState.originalArgs) {
    clickedDecision = reviewState.originalArgs.decision
  }
  const isApproving = reviewState.isLoading && clickedDecision === 'approved'
  const isRejecting = reviewState.isLoading && clickedDecision === 'rejected'

  // The details to show. The last three exist only for some requests.
  const detailItems = [
    { label: 'Status', value: <LeaveStatusBadge status={leave.status} /> },
    // Empty (shown as "—") for old requests whose code has no leave type.
    { label: 'Payment', value: paidText(leave.leaveTypeIsPaid) },
    { label: 'Days', value: leave.days + (leave.days === 1 ? ' day' : ' days') },
    { label: 'First day', value: formatDate(leave.startDate) },
    { label: 'Last day', value: formatDate(leave.endDate) },
    { label: 'Reason', value: leave.reason, wide: true },
    { label: 'Submitted', value: formatDateTime(leave.createdAt) },
  ]
  if (leave.cancelledAt) {
    detailItems.push({ label: 'Cancelled', value: formatDateTime(leave.cancelledAt) })
  }
  if (leave.reviewedBy) {
    detailItems.push({ label: 'Reviewed by', value: fullName(leave.reviewedBy) + ' · ' + formatDateTime(leave.reviewedAt) })
  }
  if (leave.reviewNote) {
    detailItems.push({ label: 'Review note', value: leave.reviewNote, wide: true })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{leave.leaveTypeName}</DialogTitle>
        <DialogDescription>
          {fullName(leave.employee)} · #{leave.employee ? leave.employee.employeeCode : ''}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-5">
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
        <DetailList items={detailItems} />
        {balanceLine ? <p className="text-[13px] text-muted-foreground">{balanceLine}</p> : null}
        {balanceMissing ? <p className="text-[13px] text-muted-foreground">Balance not shown: this leave type is inactive or no longer exists.</p> : null}
        {approveProblem ? <Alert variant="danger">{approveProblem}</Alert> : null}
        {showReview ? (
          <FormField id="review-note" label="Note to the employee" error={noteError} hint="Required when rejecting">
            <Textarea
              id="review-note"
              rows={2}
              maxLength={300}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-invalid={noteError ? true : undefined}
              aria-describedby={noteError ? 'review-note-error' : 'review-note-hint'}
            />
          </FormField>
        ) : null}
        {isConfirmingCancel ? <Alert variant="warning">Cancel this request? This cannot be undone, but you can submit a new request.</Alert> : null}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Close
        </Button>
        {showCancelButton ? (
          <Button variant="destructive-outline" onClick={() => setConfirmCancel(true)}>
            Cancel request
          </Button>
        ) : null}
        {isConfirmingCancel ? (
          <Button variant="destructive" onClick={cancelRequest} disabled={busy}>
            {cancelState.isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
            Yes, cancel request
          </Button>
        ) : null}
        {showReview ? (
          <>
            <Button variant="destructive-outline" onClick={() => submitReview('rejected')} disabled={busy}>
              {isRejecting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <XIcon aria-hidden="true" />}
              Reject
            </Button>
            {/* Approve is disabled when the balance check fails; Reject always stays available. */}
            <Button onClick={() => submitReview('approved')} disabled={busy || approveProblem !== null}>
              {isApproving ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <CheckIcon aria-hidden="true" />}
              Approve
            </Button>
          </>
        ) : null}
      </DialogFooter>
    </>
  )
}

export function LeaveDetailsDialog({ leave, canReview, canCancel, onOpenChange }) {
  return (
    <Dialog open={Boolean(leave)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {leave ? <Details key={leave.id} leave={leave} canReview={canReview} canCancel={canCancel} onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}
