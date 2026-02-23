"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { DatabaseErrorDialog } from "@/components/owner/database-error-dialog";

interface DatabaseErrorContextType {
  showDatabaseError: () => void;
  hideDatabaseError: () => void;
}

const DatabaseErrorContext = createContext<DatabaseErrorContextType | undefined>(
  undefined
);

export function DatabaseErrorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const showDatabaseError = useCallback(() => {
    setIsOpen(true);
  }, []);

  const hideDatabaseError = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleDatabaseNotFound = () => {
      showDatabaseError();
    };

    window.addEventListener("database-not-found", handleDatabaseNotFound);
    return () => {
      window.removeEventListener("database-not-found", handleDatabaseNotFound);
    };
  }, [showDatabaseError]);

  return (
    <DatabaseErrorContext.Provider value={{ showDatabaseError, hideDatabaseError }}>
      {children}
      <DatabaseErrorDialog open={isOpen} onClose={hideDatabaseError} />
    </DatabaseErrorContext.Provider>
  );
}

export function useDatabaseError() {
  const context = useContext(DatabaseErrorContext);
  if (context === undefined) {
    throw new Error("useDatabaseError must be used within a DatabaseErrorProvider");
  }
  return context;
}
