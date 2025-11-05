import { describe, it, expect, jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import Pagination from '../components/Pagination'

describe('Pagination - Enhanced Coverage', () => {
  it('does not render when totalPages is 1', () => {
    const onPageChange = jest.fn()
    const { container } = render(
      <Pagination currentPage={1} totalItems={5} pageSize={10} onPageChange={onPageChange} />
    )

    // Pagination should not render when only 1 page
    expect(container.firstChild).toBeNull()
  })

  it('renders all page numbers when total pages is small', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination currentPage={1} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onPageChange when clicking next button', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination currentPage={1} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    const nextButton = screen.getByRole('button', { name: /página siguiente/i })
    fireEvent.click(nextButton)

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange when clicking previous button', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination currentPage={2} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    const prevButton = screen.getByRole('button', { name: /página anterior/i })
    fireEvent.click(prevButton)

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('does not call onPageChange when next is disabled', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination currentPage={3} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    const nextButton = screen.getByRole('button', { name: /página siguiente/i })
    expect(nextButton).toBeDisabled()
    
    fireEvent.click(nextButton)
    // Should not call when disabled
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('does not call onPageChange when prev is disabled', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination currentPage={1} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    const prevButton = screen.getByRole('button', { name: /página anterior/i })
    expect(prevButton).toBeDisabled()
    
    fireEvent.click(prevButton)
    // Should not call when disabled
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('sets aria-current on current page', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination currentPage={2} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    const pageTwoButton = screen.getByRole('button', { name: '2' })
    expect(pageTwoButton).toHaveAttribute('aria-current', 'page')
  })

  it('does not set aria-current on non-current pages', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination currentPage={2} totalItems={30} pageSize={10} onPageChange={onPageChange} />
    )

    const pageOneButton = screen.getByRole('button', { name: '1' })
    expect(pageOneButton).not.toHaveAttribute('aria-current')
  })
})
