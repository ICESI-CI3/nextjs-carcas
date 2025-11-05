import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import useDebounce from '../hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('returns the latest value after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' }
    })

    expect(result.current).toBe('first')

    rerender({ value: 'second' })
    expect(result.current).toBe('first')

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current).toBe('second')
  })
})
