'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  className?: string
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  className = ''
}: PaginationProps) {
  const [goToPage, setGoToPage] = useState('')

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage)
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber)
      setGoToPage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage()
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages with ellipsis
      pages.push(1)
      
      if (currentPage > 4) {
        pages.push('...')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 2)
      const end = Math.min(totalPages - 1, currentPage + 2)
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i)
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...')
      }
      
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Items info and per-page selector */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startIndex}</span> to{' '}
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </div>
        
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-sm text-gray-700 whitespace-nowrap">
              Items per page:
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>

        {/* Go to page input */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          <label htmlFor="go-to-page" className="text-sm text-gray-700 whitespace-nowrap">
            Go to:
          </label>
          <Input
            id="go-to-page"
            type="number"
            min="1"
            max={totalPages}
            value={goToPage}
            onChange={(e) => setGoToPage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Page"
            className="w-20 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToPage}
            disabled={!goToPage || parseInt(goToPage) < 1 || parseInt(goToPage) > totalPages}
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  )
}