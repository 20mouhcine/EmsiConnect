import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOption = (option) => {
    const isSelected = selected.some(item => item.value === option.value);
    
    if (isSelected) {
      onChange(selected.filter(item => item.value !== option.value));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option) => {
    onChange(selected.filter(item => item.value !== option.value));
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`w-full relative ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length > 0 
          ? `${selected.length} selected`
          : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((item) => (
            <Badge key={item.value} variant="secondary" className="rounded-md px-2 py-1">
              {item.label}
              <button
                type="button"
                className="ml-1 rounded-full outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(item);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center border-b border-gray-200 px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="flex-1 border-none bg-transparent p-1 text-sm outline-none placeholder:text-gray-400"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-2 px-3 text-sm text-gray-500">No items found.</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.some(item => item.value === option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm",
                      isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                    onClick={() => toggleOption(option)}
                  >
                    <div className="flex h-4 w-4 items-center justify-center mr-2">
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;