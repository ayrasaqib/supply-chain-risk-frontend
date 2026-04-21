"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { RiskLevel } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"

export interface SearchHubOption {
  id: string
  name: string
  country: string
  region: string
  riskScore: number | null
  riskLevel: RiskLevel | null
  riskDataAvailable: boolean
}

interface HubSearchProps {
  hubs: SearchHubOption[]
  onSelectHub: (hub: SearchHubOption) => void
}

export function HubSearch({ hubs, onSelectHub }: HubSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const filteredHubs = useMemo(() => {
    if (!searchValue) return hubs
    const lowerSearch = searchValue.toLowerCase()
    return hubs.filter((hub) =>
      [hub.name, hub.country, hub.region, hub.id].some((value) =>
        value.toLowerCase().includes(lowerSearch)
      )
    )
  }, [hubs, searchValue])

  const handleSelectHub = (hub: SearchHubOption) => {
    onSelectHub(hub)
    setSearchOpen(false)
    setSearchValue("")
  }

  const getSecondaryLabel = (hub: SearchHubOption) => {
    if (hub.country === "Custom Location") {
      return `${hub.id} • ${hub.region}`
    }

    return `${hub.country} • ${hub.region}`
  }

  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-12 min-w-[11.5rem] items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-left text-slate-100 shadow-lg backdrop-blur-md transition-colors hover:bg-slate-950/55"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm font-medium text-slate-100">
            Search Hubs
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-lg border border-white/10 bg-slate-950/45 p-0 text-slate-100 shadow-lg backdrop-blur-md"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search hub by name..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No hubs found.</CommandEmpty>
            <CommandGroup heading="Hubs">
              {filteredHubs.map((hub) => (
                <CommandItem
                  key={hub.id}
                  value={`${hub.name} ${hub.country} ${hub.region} ${hub.id}`}
                  onSelect={() => handleSelectHub(hub)}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: hub.riskLevel ? RISK_COLORS[hub.riskLevel] : "#64748b" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{hub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getSecondaryLabel(hub)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-1.5 py-0 text-xs"
                    style={{
                      backgroundColor: `${hub.riskLevel ? RISK_COLORS[hub.riskLevel] : "#64748b"}20`,
                      color: hub.riskLevel ? RISK_COLORS[hub.riskLevel] : "#cbd5e1",
                    }}
                  >
                    {hub.riskScore ?? "Load"}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
