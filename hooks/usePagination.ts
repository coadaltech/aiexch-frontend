import { useState, useMemo } from 'react';

interface UsePaginationProps {
  data: any[];
  itemsPerPage?: number;
}

export function usePagination({ data, itemsPerPage = 10 }: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = data.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      totalPages,
      currentPage,
      totalItems: data.length,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationData.totalPages)));
  };

  const nextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    ...paginationData,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  };
}