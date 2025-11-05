import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { renderHook, act } from '@testing-library/react'
import useDebounce from '../hooks/useDebounce'

describe('useDebounce - Enhanced Coverage', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('uses default delay when not provided', () => {
    const { result } = renderHook(() => useDebounce('test'))

    expect(result.current).toBe('test')

    act(() => {
      renderHook(() => useDebounce('updated')).result.current
    })

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(400) // Default delay
    })

    // Should have updated after default delay
    const { result: result2 } = renderHook(() => useDebounce('updated'))
    expect(result2.current).toBe('updated')
  })

  it('debounces value with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 500 })

    // Should not update immediately
    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Should update after delay
    expect(result.current).toBe('updated')
  })
})
