// Dashboard chart: one series of counts as a bar chart (Recharts).
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from '@/components/QueryState'

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{payload[0].value}</span> {unit}
      </p>
    </div>
  )
}

// One series of counts (e.g. enabled employees per employment status).
// rows: [{ label, value }]. A screen-reader table carries the same numbers.
export function CountBarChart({ rows, unit = 'employees', caption }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  if (total === 0) {
    return <EmptyState title="No data yet" text="The chart appears once there are active employee records." className="py-8" />
  }
  return (
    <figure>
      <div className="h-56 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 22, right: 8, bottom: 0, left: -18 }} barCategoryGap="32%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--border)' }} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={44} />
            <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<ChartTooltip unit={unit} />} />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList dataKey="value" position="top" fill="var(--muted-foreground)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
