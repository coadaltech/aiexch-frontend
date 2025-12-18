"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Upload, Image } from "lucide-react";
import { useSportsGames } from "@/hooks/useAdmin";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SportsGame {
  id: number;
  eventType: string;
  name: string;
  imageUrl?: string;
  linkPath?: string;
  marketCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function SportsGamesPage() {
  const { data: games = [], isLoading, createGame, updateGame, deleteGame } = useSportsGames();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<SportsGame | null>(null);
  const confirmDialog = useConfirm();
  const [formData, setFormData] = useState({
    eventType: "",
    name: "",
    imageUrl: "",
    linkPath: "",
    marketCount: 0,
    status: "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        marketCount: Number(formData.marketCount)
      };
      if (editingGame) {
        await updateGame.mutateAsync({ id: editingGame.id, ...submitData });
      } else {
        await createGame.mutateAsync(submitData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save game:", error);
    }
  };

  const handleEdit = (game: SportsGame) => {
    setEditingGame(game);
    setFormData({
      eventType: game.eventType,
      name: game.name,
      imageUrl: game.imageUrl || "",
      linkPath: game.linkPath || "",
      marketCount: game.marketCount,
      status: game.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    confirmDialog.confirm(
      "Delete Sports Game",
      "Are you sure you want to delete this sports game? This action cannot be undone.",
      async () => {
        try {
          await deleteGame.mutateAsync(id);
        } catch (error) {
          console.error("Failed to delete game:", error);
        }
      }
    );
  };

  const resetForm = () => {
    setFormData({
      eventType: "",
      name: "",
      imageUrl: "",
      linkPath: "",
      marketCount: 0,
      status: "active",
    });
    setEditingGame(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, imageUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sports Games</h1>
          <p className="text-muted-foreground">Manage sports games and events</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGame ? "Edit Sports Game" : "Add Sports Game"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="linkPath">Link Path</Label>
                <Input
                  id="linkPath"
                  placeholder="/sports/cricket"
                  value={formData.linkPath}
                  onChange={(e) => setFormData({ ...formData, linkPath: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="marketCount">Market Count</Label>
                <Input
                  id="marketCount"
                  type="number"
                  value={formData.marketCount}
                  onChange={(e) => setFormData({ ...formData, marketCount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("imageUpload")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                  {formData.imageUrl && (
                    <div className="relative w-20 h-20">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createGame.isPending || updateGame.isPending}>
                  {editingGame ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Sports Games Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Image</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Name</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Event Type</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Link Path</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Markets</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Status</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Actions</th>
                </tr>
              </thead>
              {isLoading ? (
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 px-2"><div className="h-12 w-12 bg-muted rounded animate-pulse"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-muted rounded animate-pulse"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-muted rounded animate-pulse"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-muted rounded animate-pulse"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-muted rounded animate-pulse"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-muted rounded animate-pulse"></div></td>
                      <td className="py-3 px-2"><div className="h-8 bg-muted rounded animate-pulse"></div></td>
                    </tr>
                  ))}
                </tbody>
              ) : games.length > 0 ? (
                <tbody>
                  {games.map((game: SportsGame) => (
                    <tr key={game.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        {game.imageUrl ? (
                          <img
                            src={game.imageUrl}
                            alt={game.name}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 font-medium text-foreground text-sm">{game.name}</td>
                      <td className="py-3 px-2 text-foreground text-sm">{game.eventType}</td>
                      <td className="py-3 px-2 text-foreground text-sm">{game.linkPath || 'N/A'}</td>
                      <td className="py-3 px-2 text-foreground text-sm">{game.marketCount}</td>
                      <td className="py-3 px-2">
                        <Badge variant={game.status === "active" ? "default" : "secondary"} className="text-xs">
                          {game.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(game)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(game.id)}
                            disabled={deleteGame.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No sports games found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.config?.title || ""}
        message={confirmDialog.config?.message || ""}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
    </div>
  );
}