"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Dice1,
  Spade,
  Trophy,
  Zap,
  BookOpen,
  AlertCircle,
} from "lucide-react";

export default function GameRules() {
  return (
    <div className="min-h-screen">
      <div className="md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">Game Rules</h1>
            <Badge variant="secondary">
              <BookOpen className="w-3 h-3 mr-1" />
              Guide
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Dice1 className="w-6 h-6 text-primary" />
                <CardTitle>Casino Games</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Slots</h3>
                <p className="text-sm text-muted-foreground">
                  Match symbols across paylines to win. Check each game's
                  paytable for specific rules and bonus features.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Blackjack</h3>
                <p className="text-sm text-muted-foreground">
                  Get as close to 21 as possible without going over. Beat the
                  dealer's hand to win.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Roulette</h3>
                <p className="text-sm text-muted-foreground">
                  Bet on where the ball will land. Choose numbers, colors, or
                  sections for different payouts.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-primary" />
                <CardTitle>Sports Betting</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Match Winner</h3>
                <p className="text-sm text-muted-foreground">
                  Bet on which team or player will win the match.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Over/Under</h3>
                <p className="text-sm text-muted-foreground">
                  Bet on whether the total score will be over or under a set
                  number.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Handicap</h3>
                <p className="text-sm text-muted-foreground">
                  Bet with a point advantage/disadvantage applied to level the
                  playing field.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Spade className="w-6 h-6 text-primary" />
                <CardTitle>Live Casino</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Live Dealers</h3>
                <p className="text-sm text-muted-foreground">
                  Real dealers stream games in real-time. Interact via chat and
                  place bets during betting windows.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Betting Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Each table has minimum and maximum bet limits. Check before
                  joining a table.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-primary" />
                <CardTitle>General Rules</CardTitle>
                <Badge className="bg-info/20 text-info border-info/30">
                  Important
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Age Requirement</h3>
                <p className="text-sm text-muted-foreground">
                  Must be 18+ to play. Account verification required.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Fair Play</h3>
                <p className="text-sm text-muted-foreground">
                  All games use certified random number generators. No cheating
                  or exploitation allowed.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Responsible Gaming</h3>
                <p className="text-sm text-muted-foreground">
                  Set limits and play responsibly. Contact support if you need
                  help.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
