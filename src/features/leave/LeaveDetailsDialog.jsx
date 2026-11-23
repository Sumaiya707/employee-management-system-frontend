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
import { LEAVE_TYPE_LABELS, formatDate, formatDateTime, fullName, labelFor } from '@/lib/format'
import { useCancelLeaveMutation, useReviewLeaveMutation } from './leaveApi'

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
        <DialogTitle>{labelFor(LEAVE_TYPE_LABELS, leave.leaveType)} leave</DialogTitle>
        <DialogDescription>
          {fullName(leave.employee)} · #{leave.employee ? leave.employee.employeeCode : ''}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-5">
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
        <DetailList items={detailItems} />
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
            <Button onClick={() => submitReview('approved')} disabled={busy}>
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
