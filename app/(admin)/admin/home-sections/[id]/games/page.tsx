"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { GameModal } from "@/components/admin/game-modal";
import {
  useSectionGames,
  useCreateSectionGame,
  useUpdateSectionGame,
  useDeleteSectionGame,
} from "@/hooks/useAdmin";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SectionGamesPage() {
  const params = useParams();
  const sectionId = parseInt(params.id as string);

  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const confirmDialog = useConfirm();

  const { data: games = [], isLoading } = useSectionGames(sectionId);
  const createMutation = useCreateSectionGame();
  const updateMutation = useUpdateSectionGame();
  const deleteMutation = useDeleteSectionGame();

  const handleCreateGame = () => {
    setSelectedGame(null);
    setGameModalOpen(true);
  };

  const handleEditGame = (game: any) => {
    setSelectedGame(game);
    setGameModalOpen(true);
  };

  const handleSaveGame = async (gameData: any) => {
    try {
      if (selectedGame) {
        await updateMutation.mutateAsync({
          gameId: selectedGame.id,
          sectionId,
          body: gameData,
        });
      } else {
        await createMutation.mutateAsync({ sectionId, body: gameData });
      }
      setGameModalOpen(false);
    } catch (error) {
      console.error("Failed to save game:", error);
    }
  };

  const handleDeleteGame = (gameId: number) => {
    confirmDialog.confirm(
      "Delete Game",
      "Are you sure you want to delete this game? This action cannot be undone.",
      () => deleteMutation.mutate({ gameId, sectionId })
    );
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/home-sections">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sections
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Section Games
          </h1>
          <p className="text-muted-foreground">Manage games for this section</p>
        </div>
        <Button
          onClick={handleCreateGame}
          className="bg-primary text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Game
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Preview
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Name
                  </th>

                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                    Order
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : games.length > 0 ? (
                <tbody>
                  {games.map((game: any) => (
                    <tr key={game.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">
                          {game.name}
                        </div>

                        <div className="flex gap-1 mt-1">
                          {game.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          {game.hot && (
                            <Badge variant="destructive" className="text-xs">
                              Hot
                            </Badge>
                          )}
                        </div>
                        <div className="md:hidden text-xs text-muted-foreground">
                          Order: {game.order}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            game.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {game.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                        {game.order}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditGame(game)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-foreground"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteGame(game.id)}
                            title="Delete"
                            className="h-8 w-8 p-0 text-foreground"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
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
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No games found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <GameModal
        open={gameModalOpen}
        onClose={() => setGameModalOpen(false)}
        game={selectedGame}
        onSave={handleSaveGame}
        isLoading={isSubmitting}
      />

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
