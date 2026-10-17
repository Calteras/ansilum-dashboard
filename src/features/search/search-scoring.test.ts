import { describe, expect, it } from 'vitest'
import {
  highlightParts,
  looksLikeTransactionNo,
  rankItems,
  scoreItem,
  scoreText,
} from './search-scoring'

describe('scoreText', () => {
  it('orders exact, prefix, word prefix, substring and fuzzy matches', () => {
    const scores = [
      scoreText('outlets', 'Outlets'),
      scoreText('out', 'Outlets'),
      scoreText('mov', 'Stock movements'),
      scoreText('ments', 'Stock movements'),
      scoreText('stmv', 'Stock movements'),
    ]
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    expect(scores.every((score) => score > 0)).toBe(true)
  })

  it('ignores case and accents', () => {
    expect(scoreText('cafe', 'Café Latte')).toBeGreaterThan(0)
  })

  it('matches multi-word queries in any order', () => {
    expect(scoreText('latte matcha', 'Matcha Latte')).toBeGreaterThan(0)
  })

  it('returns 0 for unrelated or empty queries', () => {
    expect(scoreText('xyz', 'Products')).toBe(0)
    expect(scoreText('', 'Products')).toBe(0)
  })
})

describe('scoreItem and rankItems', () => {
  const pages = [
    { title: 'Employees', keywords: ['staff', 'cashier'] },
    { title: 'Stock movements', keywords: ['waste'] },
    { title: 'Products', subtitle: 'Menu' },
  ]

  it('finds items by keyword with a lower score than a title match', () => {
    expect(scoreItem('staff', pages[0])).toBeGreaterThan(0)
    expect(scoreItem('staff', pages[0])).toBeLessThan(
      scoreItem('employees', pages[0])
    )
  })

  it('ranks matches and drops the rest', () => {
    expect(rankItems('st', pages).map((p) => p.title)).toEqual([
      'Stock movements',
      'Employees',
    ])
    expect(rankItems('st', pages, 1)).toHaveLength(1)
  })
})

describe('highlightParts', () => {
  it('splits around the first match', () => {
    expect(highlightParts('Kopi Susu', 'susu')).toEqual([
      { text: 'Kopi ', match: false },
      { text: 'Susu', match: true },
    ])
    expect(highlightParts('Kopi', 'teh')).toEqual([
      { text: 'Kopi', match: false },
    ])
  })
})

describe('looksLikeTransactionNo', () => {
  it('recognises receipt numbers', () => {
    expect(looksLikeTransactionNo('TRX-00012')).toBe(true)
    expect(looksLikeTransactionNo('trx 123')).toBe(true)
    expect(looksLikeTransactionNo('#00012')).toBe(true)
    expect(looksLikeTransactionNo('kopi')).toBe(false)
    expect(looksLikeTransactionNo('12')).toBe(false)
  })
})
