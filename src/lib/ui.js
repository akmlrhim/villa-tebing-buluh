
export const fieldClass =
  'h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15'

export const searchClass =
  'h-10.5 w-full rounded-sm border border-hairline bg-canvas pl-9 pr-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15'

const CHEVRON =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%236e6759%22%20stroke-width=%221.8%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-position-[right_0.875rem_center] bg-no-repeat"

export const selectClass = `h-10.5 w-full appearance-none rounded-sm border border-hairline bg-canvas ${CHEVRON} pl-3.5 pr-10 text-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15`

const CALENDAR =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%236e6759%22%20stroke-width=%221.7%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22M8%202v4m8-4v4M4.5%204h15A1.5%201.5%200%200%201%2021%205.5v14a1.5%201.5%200%200%201-1.5%201.5h-15A1.5%201.5%200%200%201%203%2019.5v-14A1.5%201.5%200%200%201%204.5%204ZM3%2010h18%22/%3E%3C/svg%3E')] bg-position-[right_0.875rem_center] bg-no-repeat"

const PICKER_OVERLAY =
  '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:opacity-0'

export const dateClass = `relative h-10.5 w-full cursor-pointer appearance-none rounded-sm border border-hairline bg-canvas ${CALENDAR} pl-3.5 pr-10 text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 ${PICKER_OVERLAY} [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:leading-normal`

export const btnPrimary =
  'inline-flex h-10.5 items-center justify-center gap-2 rounded-sm bg-primary px-[1.1rem] text-[0.9375rem] font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60'

export const btnGhost =
  'inline-flex h-10.5 items-center justify-center gap-2 rounded-sm border border-hairline bg-canvas px-[1.1rem] text-[0.9375rem] font-medium text-ink transition-colors hover:border-border-strong'

export const btnDanger =
  'inline-flex h-10.5 items-center gap-2 rounded-sm bg-error px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60'
