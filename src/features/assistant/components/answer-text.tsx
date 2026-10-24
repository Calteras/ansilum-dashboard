import { Fragment, type ReactNode } from 'react'

const BULLET = /^\s*[-*•]\s+/
const NUMBERED = /^\s*\d+[.)]\s+/
const HEADING = /^(#{1,4})\s+(.*)$/
const TABLE_ROW = /^\s*\|.*\|\s*$/
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

/**
 * Renders the Markdown subset answers use (headings, paragraphs, bullet and
 * numbered lists, pipe tables, **bold**) as React elements. Never HTML: the text
 * comes from a model.
 */
export function AnswerText({ text }: { text: string }) {
  return (
    <div className='space-y-3 text-[15px] leading-7'>
      {splitBlocks(text).map((block, index) => (
        <Block key={index} lines={block} />
      ))}
    </div>
  )
}

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

function Block({ lines }: { lines: string[] }) {
  const heading = lines.length === 1 ? HEADING.exec(lines[0]) : null
  if (heading)
    return (
      <p
        role='heading'
        aria-level={Math.min(heading[1].length + 2, 6)}
        className='pt-1 font-semibold'
      >
        {inline(heading[2])}
      </p>
    )
  if (
    lines.length >= 2 &&
    lines.every((line) => TABLE_ROW.test(line) || TABLE_RULE.test(line))
  )
    return <MarkdownTable lines={lines} />
  if (lines.every((line) => BULLET.test(line)))
    return (
      <ul className='list-disc space-y-1 ps-5'>
        {lines.map((line, i) => (
          <li key={i}>{inline(line.replace(BULLET, ''))}</li>
        ))}
      </ul>
    )
  if (lines.every((line) => NUMBERED.test(line)))
    return (
      <ol className='list-decimal space-y-1 ps-5'>
        {lines.map((line, i) => (
          <li key={i}>{inline(line.replace(NUMBERED, ''))}</li>
        ))}
      </ol>
    )
  return (
    <p>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(line)}
        </Fragment>
      ))}
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
    <div className='border-divider overflow-x-auto rounded-md border'>
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
