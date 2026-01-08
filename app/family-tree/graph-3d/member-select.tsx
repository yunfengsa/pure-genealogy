"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FamilyMemberNode } from "../graph/actions";

interface MemberSelectProps {
  members: FamilyMemberNode[];
  value: number | null;
  onChange: (value: number) => void;
  placeholder?: string;
}

export function MemberSelect({
  members,
  value,
  onChange,
  placeholder = "选择成员...",
}: MemberSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredMembers = React.useMemo(() => {
    if (!search) return members;
    const lowerSearch = search.toLowerCase();
    return members.filter((member) =>
      member.name.toLowerCase().includes(lowerSearch)
    );
  }, [members, search]);

  const selectedMember = members.find((m) => m.id === value);

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMember ? selectedMember.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="搜索姓名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 px-0"
          />
        </div>
        <ScrollArea className="h-48 sm:h-72">
          <div className="p-1">
            {filteredMembers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                未找到成员
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === member.id && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onChange(member.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === member.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{member.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    (第{member.generation}世)
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
