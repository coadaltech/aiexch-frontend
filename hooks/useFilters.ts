import { useState, useMemo } from 'react';

interface FilterConfig {
  [key: string]: any;
}

interface UseFiltersProps<T> {
  data: T[];
  initialFilters?: FilterConfig;
}

export function useFilters<T extends Record<string, any>>({ 
  data, 
  initialFilters = {} 
}: UseFiltersProps<T>) {
  const [filters, setFilters] = useState<FilterConfig>(initialFilters);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all' || value === '') return true;
        
        // Handle date range filters
        if (key.includes('From')) {
          const dateKey = key.replace('From', '').toLowerCase();
          const itemDate = new Date(item[dateKey] || item.createdAt);
          return itemDate >= new Date(value);
        }
        
        if (key.includes('To')) {
          const dateKey = key.replace('To', '').toLowerCase();
          const itemDate = new Date(item[dateKey] || item.createdAt);
          return itemDate <= new Date(value + 'T23:59:59');
        }

        // Handle search filters
        if (key === 'search') {
          const searchFields = ['name', 'username', 'email', 'title', 'method', 'reference'];
          return searchFields.some(field => 
            item[field]?.toString().toLowerCase().includes(value.toLowerCase())
          );
        }

        // Handle exact match filters
        return item[key] === value;
      });
    });
  }, [data, filters]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateFilters = (newFilters: FilterConfig) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  return {
    filters,
    filteredData,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    hasActiveFilters: Object.values(filters).some(v => v && v !== 'all' && v !== ''),
  };
}