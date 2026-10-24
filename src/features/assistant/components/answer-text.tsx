import { Fragment, type ReactNode } from 'react'

const BULLET = /^\s*[-*•]\s+/
const NUMBERED = /^\s*\d+[.)]\s+/
const HEADING = /^(#{1,4})\s+(.*)$/
const TABLE_ROW = /^\s*\|.*\|\s*$/
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

/**
 * Renders the Markdown subset answers use (headings, paragraphs, bullet and
 * numbered lists, pipe tables, **bold**) as React elements. Never HTML: the text
 * comes from a model. `caret` marks the end of text still being written.
 */
export function AnswerText({ text, caret }: { text: string; caret?: boolean }) {
  const blocks = splitBlocks(text)
  return (
    <div className='space-y-4 text-[15px] leading-7'>
      {blocks.map((block, index) => (
        <Block
          key={index}
          lines={block}
          caret={caret && index === blocks.length - 1}
        />
      ))}
      {caret && !blocks.length && <Caret />}
    </div>
  )
}

const Caret = () => <span className='aa-caret' aria-hidden='true' />

/** Blank lines separate blocks; a heading line is always a block of its own. */
function splitBlocks(text: string): string[][] {
  const blocks: string[][] = []
  let current: string[] = []
  const close = () => {
    if (current.length) blocks.push(current)
    current = []
  }
  for (const line of text.trim().split('\n')) {
    if (!line.trim()) close()
    else if (HEADING.test(line)) {
      close()
      blocks.push([line])
    } else current.push(line)
  }
  close()
  return blocks
}

function Block({ lines, caret }: { lines: string[]; caret?: boolean }) {
  const end = caret ? <Caret /> : null
  const heading = lines.length === 1 ? HEADING.exec(lines[0]) : null
  if (heading)
    return (
      <p
        role='heading'
        aria-level={Math.min(heading[1].length + 2, 6)}
        className='pt-2 text-base font-semibold'
      >
        {inline(heading[2])}
        {end}
      </p>
    )
  if (
    lines.length >= 2 &&
    lines.every((line) => TABLE_ROW.test(line) || TABLE_RULE.test(line))
  )
    return (
      <>
        <MarkdownTable lines={lines} />
        {end}
      </>
    )
  const list = lines.every((line) => BULLET.test(line))
    ? { Tag: 'ul' as const, marker: BULLET, className: 'list-disc' }
    : lines.every((line) => NUMBERED.test(line))
      ? { Tag: 'ol' as const, marker: NUMBERED, className: 'list-decimal' }
      : null
  if (list)
    return (
      <list.Tag
        className={`${list.className} marker:text-fg-muted space-y-1.5 ps-6`}
      >
        {lines.map((line, i) => (
          <li key={i} className='ps-1'>
            {inline(line.replace(list.marker, ''))}
            {i === lines.length - 1 && end}
          </li>
        ))}
      </list.Tag>
    )
  return (
    <p>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(line)}
        </Fragment>
      ))}
      {end}
    </p>
  )
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())

function MarkdownTable({ lines }: { lines: string[] }) {
  const ruleIndex = lines.findIndex((line) => TABLE_RULE.test(line))
  const header = ruleIndex === 1 ? cells(lines[0]) : null
  const body = lines
    .filter((_, i) => i !== ruleIndex && !(header && i === 0))
    .map(cells)
  return (
    <div className='border-divider overflow-x-auto rounded-xl border'>
      <table className='w-full text-left text-sm tabular-nums'>
        {header && (
          <thead>
            <tr className='border-divider border-b'>
              {header.map((cell, i) => (
                <th
                  key={i}
                  className='text-fg-muted px-3 py-2 text-xs font-semibold'
                >
                  {inline(cell)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, r) => (
            <tr key={r} className='border-divider border-b last:border-0'>
              {row.map((cell, c) => (
                <td key={c} className='px-3 py-2'>
                  {inline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** **bold** and [S1] citation markers. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[S\d{1,3}\])/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^\[S\d{1,3}\]$/.test(part))
      return (
        <sup
          key={i}
          className='bg-brand-soft text-brand-ink mx-0.5 rounded px-1 text-[11px] font-semibold'
        >
          {part.slice(1, -1)}
        </sup>
      )
    return <Fragment key={i}>{part}</Fragment>
  })
}
