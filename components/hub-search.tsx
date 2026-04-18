"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import type { SupplyChainHub } from "@/lib/types"
import { RISK_COLORS } from "@/lib/types"

interface HubSearchProps {
  hubs: SupplyChainHub[]
  onSelectHub: (hub: SupplyChainHub) => void
}

export function HubSearch({ hubs, onSelectHub }: HubSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const filteredHubs = useMemo(() => {
    if (!searchValue) return hubs
    const lowerSearch = searchValue.toLowerCase()
    return hubs.filter((hub) => hub.name.toLowerCase().includes(lowerSearch))
  }, [hubs, searchValue])

  const handleSelectHub = (hub: SupplyChainHub) => {
    onSelectHub(hub)
    setSearchOpen(false)
    setSearchValue("")
  }

  const getSecondaryLabel = (hub: SupplyChainHub) => {
    if (hub.country === "Custom Location") {
      return `${hub.id} • ${hub.region}`
    }

    return `${hub.country} • ${hub.region}`
  }

  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-auto rounded-lg border border-white/10 bg-slate-950/45 px-3 py-3 text-slate-100 shadow-lg backdrop-blur-md hover:bg-slate-950/55 hover:text-white"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search Hubs</span>
        </Button>
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
                  value={hub.name}
                  onSelect={() => handleSelectHub(hub)}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: RISK_COLORS[hub.riskLevel] }}
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
                      backgroundColor: `${RISK_COLORS[hub.riskLevel]}20`,
                      color: RISK_COLORS[hub.riskLevel],
                    }}
                  >
                    {hub.riskScore}
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
