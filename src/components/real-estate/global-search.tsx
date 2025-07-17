"use client"

import { useState, useEffect } from "react"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Home, Users, FileText, Calendar, Phone, Mail } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SearchResult {
  id: string
  type: "property" | "client" | "document" | "task" | "showing"
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, any>
  url?: string
}

interface GlobalSearchProps {
  onSearch?: (query: string) => Promise<SearchResult[]>
  onSelectResult?: (result: SearchResult) => void
  placeholder?: string
  disabled?: boolean
}

export function GlobalSearch({ 
  onSearch, 
  onSelectResult, 
  placeholder = "Search properties, clients, documents...",
  disabled = false
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  const mockResults: SearchResult[] = [
    {
      id: "1",
      type: "property",
      title: "Luxury Downtown Condo",
      subtitle: "123 Main St, Downtown",
      description: "2 bed, 2 bath • $450,000",
      metadata: { price: 450000, bedrooms: 2, bathrooms: 2 },
      url: "/properties/1"
    },
    {
      id: "2",
      type: "client",
      title: "John Smith",
      subtitle: "john.smith@email.com",
      description: "Active client • Budget: $300k-$400k",
      metadata: { status: "active", budget: 350000 },
      url: "/clients/2"
    },
    {
      id: "3",
      type: "document",
      title: "Purchase Agreement - 123 Main St",
      subtitle: "Contract",
      description: "Pending signature • Created 2 days ago",
      metadata: { status: "pending", created: "2024-01-15" },
      url: "/documents/3"
    },
    {
      id: "4",
      type: "task",
      title: "Follow up with Jane Doe",
      subtitle: "High Priority",
      description: "Due tomorrow • Call about property viewing",
      metadata: { priority: "high", due: "2024-01-18" },
      url: "/tasks/4"
    },
    {
      id: "5",
      type: "showing",
      title: "Property Showing - 456 Oak Ave",
      subtitle: "Tomorrow at 2:00 PM",
      description: "Client: Mike Johnson • 3 bed colonial",
      metadata: { date: "2024-01-18", time: "14:00" },
      url: "/showings/5"
    }
  ]

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchResults = async () => {
      setLoading(true)
      try {
        if (onSearch) {
          const searchResults = await onSearch(query)
          setResults(searchResults)
        } else {
          // Mock search with delay
          await new Promise(resolve => setTimeout(resolve, 200))
          const filtered = mockResults.filter(result =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
            result.description?.toLowerCase().includes(query.toLowerCase())
          )
          setResults(filtered)
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchResults, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, onSearch])

  const getIcon = (type: string) => {
    switch (type) {
      case "property":
        return <Home className="h-4 w-4" />
      case "client":
        return <Users className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "task":
        return <Calendar className="h-4 w-4" />
      case "showing":
        return <Calendar className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "property":
        return "bg-blue-100 text-blue-800"
      case "client":
        return "bg-green-100 text-green-800"
      case "document":
        return "bg-purple-100 text-purple-800"
      case "task":
        return "bg-orange-100 text-orange-800"
      case "showing":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSelect = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result)
    } else if (result.url) {
      window.location.href = result.url
    }
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : "No results found."}
          </CommandEmpty>
          
          {results.length > 0 && (
            <>
              <CommandGroup heading="Properties">
                {results.filter(r => r.type === "property").map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getIcon(result.type)}
                      <div>
                        <p className="font-medium">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getTypeColor(result.type)}>
                      {result.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Clients">
                {results.filter(r => r.type === "client").map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getIcon(result.type)}
                      <div>
                        <p className="font-medium">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getTypeColor(result.type)}>
                      {result.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Documents">
                {results.filter(r => r.type === "document").map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getIcon(result.type)}
                      <div>
                        <p className="font-medium">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getTypeColor(result.type)}>
                      {result.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandGroup heading="Tasks & Showings">
                {results.filter(r => r.type === "task" || r.type === "showing").map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getIcon(result.type)}
                      <div>
                        <p className="font-medium">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getTypeColor(result.type)}>
                      {result.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}