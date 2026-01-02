import { useState } from "react";
import { Search } from "lucide-react";

interface SearchFilterProps {
  items: any[];
  searchFields: string[];
  onFilter: (filtered: any[]) => void;
  placeholder?: string;
}

export function SearchFilter({ items, searchFields, onFilter, placeholder = "Search..." }: SearchFilterProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);

    if (!value.trim()) {
      onFilter(items);
      return;
    }

    const filtered = items.filter((item) =>
      searchFields.some((field) => {
        const fieldValue = String(item[field] || "").toLowerCase();
        return fieldValue.includes(value.toLowerCase());
      })
    );

    onFilter(filtered);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        data-testid="input-search"
      />
    </div>
  );
}
