'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building, Users, FileText, X } from 'lucide-react'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useClientStore } from '@/stores/useClientStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { showToast } from '@/lib/toast'

interface SearchResult {
  id: string
  type: 'property' | 'client' | 'document'
  title: string
  subtitle: string
  url: string
}

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { properties } = usePropertyStore()
  const { clients } = useClientStore()
  const { documents } = useDocumentStore()

  // Close search on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchTerm('')
        setSelectedIndex(-1)
      } else if (e.key === 'ArrowDown' && isOpen) {
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp' && isOpen) {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && isOpen && selectedIndex >= 0) {
        e.preventDefault()
        handleResultClick(results[selectedIndex])
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Perform search when search term changes
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([])
      setSelectedIndex(-1)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      performSearch(searchTerm)
      setIsSearching(false)
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [searchTerm, properties, clients, documents])

  const performSearch = (term: string) => {
    const searchResults: SearchResult[] = []
    const lowerTerm = term.toLowerCase()

    // Search properties
    properties
      .filter(property => 
        property.address?.toLowerCase().includes(lowerTerm) ||
        property.city?.toLowerCase().includes(lowerTerm) ||
        property.property_id?.toLowerCase().includes(lowerTerm) ||
        property.mls_number?.toLowerCase().includes(lowerTerm)
      )
      .slice(0, 5) // Limit to 5 results per type
      .forEach(property => {
        searchResults.push({
          id: property.id,
          type: 'property',
          title: `${property.address}, ${property.city}`,
          subtitle: `${property.property_id} • $${property.price?.toLocaleString() || 'N/A'}`,
          url: `/properties/${property.id}`
        })
      })

    // Search clients
    clients
      .filter(client => 
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(lowerTerm) ||
        client.email?.toLowerCase().includes(lowerTerm) ||
        client.phone?.includes(term)
      )
      .slice(0, 5)
      .forEach(client => {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: `${client.first_name} ${client.last_name}`,
          subtitle: `${client.email || client.phone || ''} • ${client.client_type}`,
          url: `/clients/${client.id}`
        })
      })

    // Search documents
    documents
      .filter(document => 
        document.title?.toLowerCase().includes(lowerTerm) ||
        document.document_type?.toLowerCase().includes(lowerTerm)
      )
      .slice(0, 5)
      .forEach(document => {
        searchResults.push({
          id: document.id,
          type: 'document',
          title: document.title || 'Untitled Document',
          subtitle: `${document.document_type} • ${document.status}`,
          url: `/documents/${document.id}`
        })
      })

    setResults(searchResults)
    setSelectedIndex(-1)
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedIndex(-1)
    showToast.success(`Navigating to ${result.type}`)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Building className="w-4 h-4 text-blue-500" />
      case 'client':
        return <Users className="w-4 h-4 text-green-500" />
      case 'document':
        return <FileText className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  return (
    <div className="relative" ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search properties, clients, documents... (Ctrl+K)"
          className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchTerm.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white/100 border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto" style={{backgroundColor: 'white', opacity: 1}}>
          {isSearching && (
            <div className="p-4 text-center text-gray-600">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Searching...
              </div>
            </div>
          )}

          {!isSearching && searchTerm.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-gray-600">
              No results found for "{searchTerm}"
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    index === selectedIndex ? 'bg-gray-100' : ''
                  }`}
                >
                  {getIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 capitalize bg-gray-100 px-2 py-1 rounded">
                    {result.type}
                  </div>
                </button>
              ))}

              {results.length >= 15 && (
                <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-200">
                  Showing first 15 results. Refine your search for more specific results.
                </div>
              )}
            </div>
          )}

          {/* Search Tips */}
          {searchTerm.length < 2 && (
            <div className="p-4 text-xs text-gray-600 border-t border-gray-200">
              <div className="space-y-1">
                <div>• Type at least 2 characters to search</div>
                <div>• Use arrow keys to navigate results</div>
                <div>• Press Enter to select</div>
                <div>• Press Escape to close</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}