/**
 * Badge classes for record states, from the semantic status tokens. Pick the
 * tone by what the state means for the merchant, not by its name.
 */
export const STATUS_TONE = {
  success: 'bg-status-success/10 text-status-success border-status-success/25',
  info: 'bg-status-info/10 text-status-info border-status-info/25',
  warning: 'bg-status-warning/10 text-status-warning border-status-warning/25',
  danger: 'bg-status-danger/10 text-status-danger border-status-danger/25',
  neutral: 'bg-muted text-fg-secondary border-border',
} as const
