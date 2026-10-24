import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnswerText } from './answer-text'

describe('AnswerText', () => {
  it('renders headings, lists, tables, bold and citation markers', () => {
    const { container } = render(
      <AnswerText
        text={[
          '## Tren Penjualan',
          '',
          'Total **Rp581.000** dari 10 transaksi [S1].',
          '',
          '- Selasa ramai',
          '- Sabtu sepi',
          '',
          '| Tanggal | Penjualan |',
          '|---|---|',
          '| 9 Okt | Rp120.000 |',
        ].join('\n')}
      />
    )
    expect(
      screen.getByRole('heading', { name: 'Tren Penjualan' })
    ).toBeInTheDocument()
    expect(screen.getByText('Rp581.000').tagName).toBe('STRONG')
    expect(screen.getByText('S1').tagName).toBe('SUP')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(
      screen.getByRole('columnheader', { name: 'Penjualan' })
    ).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Rp120.000' })).toBeInTheDocument()
    expect(container.textContent).not.toContain('##')
  })

  it('never renders model text as HTML', () => {
    const { container } = render(
      <AnswerText
        text={'<img src=x onerror="alert(1)"> <script>alert(2)</script>'}
      />
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('<img src=x')
  })
})
