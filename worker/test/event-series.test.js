import { describe, it, expect } from 'vitest'
import {
  listOccurrencesInRange,
  isSeriesTemplate,
  isSeriesSession,
  mergeTemplateWithSession,
  limitSessionsPerSeries
} from '../src/utils/event-series.js'

describe('event-series helpers', () => {
  it('identifies series templates and sessions', () => {
    expect(isSeriesTemplate({ is_recurring: 1, series_id: null })).toBe(true)
    expect(isSeriesTemplate({ is_recurring: 0, series_id: null })).toBe(false)
    expect(isSeriesSession({ series_id: 5 })).toBe(true)
  })

  it('merges template content with session datetime and counts', () => {
    const merged = mergeTemplateWithSession(
      { event_id: 1, event_name: 'Weekly League', slug: 'weekly-league', organiser: 'GWC' },
      { event_id: 99, event_datetime: '2026-04-02T17:00:00.000Z', tickets_sold: 3, capacity: 20, occurrence_key: '2026-04-02T17:00:00.000Z' }
    )
    expect(merged.id).toBe(99)
    expect(merged.slug).toBe('weekly-league')
    expect(merged.title).toBe('Weekly League')
    expect(merged.tickets_sold).toBe(3)
    expect(merged.session_event_id).toBe(99)
  })

  it('lists weekly occurrences in range', () => {
    const series = {
      is_recurring: 1,
      recurrence_pattern: JSON.stringify({ type: 'weekly', day: 3, time: '18:00' }),
      recurrence_end_date: null
    }
    const from = new Date('2026-04-01T00:00:00.000Z')
    const to = new Date('2026-04-30T23:59:59.999Z')
    const dates = listOccurrencesInRange(series, from, to, 10)
    expect(dates.length).toBeGreaterThanOrEqual(3)
    expect(dates.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime())
    }
  })

  it('limits public sessions to two per series', () => {
    const rows = [
      { id: 1, series_id: 10, slug: 'weekly', event_datetime: '2026-04-02T18:00:00.000Z' },
      { id: 2, series_id: 10, slug: 'weekly', event_datetime: '2026-04-09T18:00:00.000Z' },
      { id: 3, series_id: 10, slug: 'weekly', event_datetime: '2026-04-16T18:00:00.000Z' },
      { id: 4, series_id: 20, slug: 'other', event_datetime: '2026-04-03T18:00:00.000Z' }
    ]
    const limited = limitSessionsPerSeries(rows, 2)
    expect(limited).toHaveLength(3)
    expect(limited.map(r => r.id)).toEqual([1, 2, 4])
  })

  it('respects recurrence_end_date in range listing', () => {
    const series = {
      is_recurring: 1,
      recurrence_pattern: JSON.stringify({ type: 'weekly', day: 1, time: '10:00' }),
      recurrence_end_date: '2026-04-15'
    }
    const from = new Date('2026-04-01T00:00:00.000Z')
    const to = new Date('2026-05-31T23:59:59.999Z')
    const dates = listOccurrencesInRange(series, from, to, 20)
    expect(dates.length).toBeGreaterThan(0)
    const end = new Date('2026-04-15T23:59:59.999Z')
    expect(dates.every(d => d <= end || d.getUTCDate() <= 15)).toBe(true)
  })
})
