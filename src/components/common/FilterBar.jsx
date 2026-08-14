import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Config-driven filter row: lecturer/course/batch/status dropdowns plus an
 * optional date range, all controlled by the parent. Presentation-only —
 * matches DataTable's convention that pages own their own filtering
 * (`useMemo` over the full dataset); this component only renders controls
 * and reports value changes via onChange.
 *
 * `filters`: [{ key, label, type: 'select', placeholder, options: [{value, label}] }]
 * `dateRange`: pass `{ from, to, onFromChange, onToChange }` to render a date-range pair.
 */
export function FilterBar({ filters = [], values, onChange, dateRange, onClear, active }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={values[filter.key] || 'all'}
          onValueChange={(value) => onChange(filter.key, value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={filter.placeholder ?? filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label.toLowerCase()}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {dateRange ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-full sm:w-40"
            value={dateRange.from}
            onChange={(e) => dateRange.onFromChange(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            className="w-full sm:w-40"
            value={dateRange.to}
            onChange={(e) => dateRange.onToChange(e.target.value)}
          />
        </div>
      ) : null}

      {active ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="size-3.5" /> Clear filters
        </Button>
      ) : null}
    </div>
  )
}
