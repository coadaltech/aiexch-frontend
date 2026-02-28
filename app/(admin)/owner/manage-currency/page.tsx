"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, History, Loader2 } from "lucide-react";
import {
  useCurrencies,
  useAvailableCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useCurrencyHistory,
} from "@/hooks/useOwner";
import { TableSkeleton } from "@/components/owner/skeletons";
import { cn } from "@/lib/utils";

export default function ManageCurrencyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isOwner = user?.role === "owner";

  const [addOpen, setAddOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<{
    code: string;
    name: string;
    countryName: string;
  } | null>(null);
  const [addValue, setAddValue] = useState("1");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [historyCurrencyId, setHistoryCurrencyId] = useState<number | null>(null);

  const { data: managedCurrencies = [], isLoading } = useCurrencies();
  const { data: availableCurrencies = [], isLoading: loadingAvailable } =
    useAvailableCurrencies();
  const createMutation = useCreateCurrency();
  const updateMutation = useUpdateCurrency();
  const { data: historyEntries = [], isLoading: loadingHistory } =
    useCurrencyHistory(historyCurrencyId);

  // Only owner can access
  if (user && !isOwner) {
    router.replace("/owner");
    return null;
  }

  const addedCodes = new Set(managedCurrencies.map((c: any) => c.code));
  const canAddList = availableCurrencies.filter(
    (c: { code: string }) => !addedCodes.has(c.code)
  );

  const handleAddCurrency = () => {
    if (!selectedCurrency || !addValue.trim()) return;
    createMutation.mutate(
      {
        code: selectedCurrency.code,
        name: selectedCurrency.name,
        countryName: selectedCurrency.countryName,
        value: addValue.trim(),
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setSelectedCurrency(null);
          setAddValue("1");
        },
      }
    );
  };

  const handleStartEdit = (row: { id: string; value: string }) => {
    setEditingId(row.id);
    setEditValue(String(row.value));
  };

  const handleSaveEdit = () => {
    if (editingId == null || editValue.trim() === "") return;
    updateMutation.mutate(
      { id: editingId, value: editValue.trim() },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditValue("");
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Manage Currency
          </h1>
          <p className="text-muted-foreground">
            Add currencies and set their values. Previous values are kept in
            history.
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground w-full sm:w-auto"
          disabled={canAddList.length === 0}
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Currency
        </Button>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setSelectedCurrency(null);
            setAddValue("1");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Currency</DialogTitle>
            <DialogDescription>
              Choose a currency and set its value. You can change the value later and view previous values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Currency
              </label>
              <div className="max-h-52 overflow-y-auto rounded-md border border-border bg-muted/30 p-1.5 space-y-0.5">
                {loadingAvailable ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Loading currencies…
                  </p>
                ) : canAddList.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    All currencies are already added.
                  </p>
                ) : (
                  canAddList.map((c: { code: string; name: string; countryName: string }) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c)}
                      className={cn(
                        "w-full text-left rounded-md px-3 py-2.5 text-sm transition-colors",
                        selectedCurrency?.code === c.code
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className={cn("ml-1.5", selectedCurrency?.code === c.code ? "opacity-90" : "text-muted-foreground")}>
                        {c.code} · {c.countryName}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="add-currency-value">
                Value
              </label>
              <Input
                id="add-currency-value"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1 or 82.5"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                disabled={!selectedCurrency}
                className="font-mono"
              />
              {!selectedCurrency && (
                <p className="text-xs text-muted-foreground">
                  Select a currency above first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCurrency}
              disabled={!selectedCurrency || createMutation.isPending || !addValue.trim()}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Currency"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Currencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Code
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Country
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Value
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={5} />
              ) : managedCurrencies.length > 0 ? (
                <tbody>
                  {managedCurrencies.map((row: any) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/50"
                    >
                      <td className="py-3 px-2 font-medium text-foreground">
                        {row.code}
                      </td>
                      <td className="py-3 px-2 text-foreground text-sm">
                        {row.name}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">
                        {row.countryName}
                      </td>
                      <td className="py-3 px-2">
                        {editingId === row.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              className="w-28 h-8"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={
                                updateMutation.isPending || !editValue.trim()
                              }
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="text-foreground font-mono text-sm">
                            {row.value}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          {editingId !== row.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(row)}
                              title="Edit value"
                              className="h-8 w-8 p-0 text-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setHistoryCurrencyId(row.id)}
                            title="View previous values"
                            className="h-8 w-8 p-0 text-foreground"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No currencies added yet. Click &quot;Add Currency&quot; to
                      add one.
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={historyCurrencyId !== null}
        onOpenChange={(open) => !open && setHistoryCurrencyId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Previous values</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto">
            {loadingHistory ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : historyEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No previous values recorded.
              </p>
            ) : (
              <ul className="space-y-2">
                {historyEntries.map((entry: any) => (
                  <li
                    key={entry.id}
                    className="flex justify-between text-sm border-b border-border/50 pb-2"
                  >
                    <span className="font-mono text-foreground">
                      {entry.value}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
