import { describe, it, expect, jest } from '@jest/globals'
import * as matchers from '@testing-library/jest-dom/matchers'
import { fireEvent, render, screen } from '@testing-library/react'
import Pagination from '../components/Pagination'

expect.extend(matchers)

describe('Pagination', () => {
  it('disables previous button on first page and triggers callbacks', () => {
    const onPageChange = jest.fn()

    render(
      <Pagination currentPage={1} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    const prevButton = screen.getByRole('button', { name: /página anterior/i })
    expect(prevButton).toBeDisabled()

    const pageTwoButton = screen.getByRole('button', { name: '2' })
    fireEvent.click(pageTwoButton)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
