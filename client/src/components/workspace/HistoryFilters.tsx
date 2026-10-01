import { FormField, Input, Select } from '../ui/Field'
import type { HistoryQuery } from '../../api/workspace.api'
export function HistoryFilters({
  query,
  onChange,
  options,
  searchLabel,
}: {
  query: HistoryQuery
  onChange: (changes: Partial<HistoryQuery>) => void
  options: Array<{ value: string; label: string }>
  searchLabel: string
}) {
  return (
    <div className="history-filters">
      <FormField label={searchLabel} id="history-search">
        <Input
          id="history-search"
          type="search"
          value={query.search}
          maxLength={100}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </FormField>
      <FormField label="Event type" id="history-type">
        <Select
          id="history-type"
          value={query.filter}
          onChange={(e) => onChange({ filter: e.target.value })}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="From date" id="history-from">
        <Input
          id="history-from"
          type="date"
          max={query.to || undefined}
          value={query.from}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </FormField>
      <FormField label="Through date" id="history-to">
        <Input
          id="history-to"
          type="date"
          min={query.from || undefined}
          value={query.to}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </FormField>
      <p className="text-caption text-secondary-foreground">
        Dates follow the Asia/Manila business day.
      </p>
    </div>
  )
}
