import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface UseTableSortProps<T> {
  data: T[];
  initialSort?: SortConfig;
}

export function useTableSort<T extends Record<string, any>>({ 
  data, 
  initialSort 
}: UseTableSortProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSort || null);

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // Handle dates
      if (sortConfig.key.includes('date') || sortConfig.key.includes('At')) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle strings (case-insensitive)
      const stringA = aValue.toString().toLowerCase();
      const stringB = bValue.toString().toLowerCase();
      
      if (stringA < stringB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (stringA > stringB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig(direction ? { key, direction } : null);
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction;
  };

  const clearSort = () => {
    setSortConfig(null);
  };

  return {
    sortedData,
    sortConfig,
    requestSort,
    getSortIcon,
    clearSort,
  };
}