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

interface ParentOption {
  id: number;
  name: string;
  generation: number | null;
}

interface FatherComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ParentOption[];
  disabled?: boolean;
  isLoading?: boolean;
}

export function FatherCombobox({
  value,
  onChange,
  options,
  disabled,
  isLoading,
}: FatherComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedOption = options.find((opt) => opt.id.toString() === value);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchName = opt.name.toLowerCase().includes(lowerQuery);
      const matchGen = opt.generation?.toString() === lowerQuery;
      const matchGenText = `第${opt.generation}世`.includes(lowerQuery);
      return matchName || matchGen || matchGenText;
    });
  }, [options, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="text-muted-foreground">加载中...</span>
          ) : selectedOption ? (
            <span>
              {selectedOption.name}
              {selectedOption.generation !== null && (
                <span className="text-muted-foreground ml-1">
                  (第{selectedOption.generation}世)
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">选择父亲...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[100]" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center px-2 border rounded-md">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="搜索姓名或世代..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none focus-visible:ring-0 px-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="h-[200px] w-full overflow-y-auto p-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start font-normal",
              value === "null" && "bg-accent"
            )}
            onClick={() => {
              onChange("null");
              setOpen(false);
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === "null" ? "opacity-100" : "opacity-0"
              )}
            />
            无
          </Button>
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              未找到匹配成员
            </div>
          ) : (
            filteredOptions.map((option) => (
              <Button
                key={option.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start font-normal",
                  value === option.id.toString() && "bg-accent"
                )}
                onClick={() => {
                  onChange(option.id.toString());
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.id.toString()
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <span>
                  {option.name}
                  {option.generation !== null && (
                    <span className="text-muted-foreground ml-1">
                      (第{option.generation}世)
                    </span>
                  )}
                </span>
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
