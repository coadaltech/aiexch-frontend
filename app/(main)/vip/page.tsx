"use client";

import { Crown, Star, Gift, Trophy, Zap, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const vipTiers = [
  { name: "Bronze", level: 1, color: "text-amber-600", bg: "bg-amber-600/20" },
  { name: "Silver", level: 2, color: "text-gray-400", bg: "bg-gray-400/20" },
  { name: "Gold", level: 3, color: "text-yellow-500", bg: "bg-yellow-500/20" },
  { name: "Platinum", level: 4, color: "text-blue-400", bg: "bg-blue-400/20" },
  {
    name: "Diamond",
    level: 5,
    color: "text-purple-400",
    bg: "bg-purple-400/20",
  },
];

const benefits = [
  { icon: Gift, title: "Exclusive Bonuses", desc: "Higher bonus percentages" },
  { icon: Zap, title: "Faster Withdrawals", desc: "Priority processing" },
  { icon: Users, title: "Personal Manager", desc: "Dedicated VIP support" },
  { icon: Trophy, title: "Special Events", desc: "VIP-only tournaments" },
];

export default function VIPClub() {
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
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">VIP Club</h1>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Exclusive
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join our exclusive VIP program and unlock premium rewards,
                personalized service, and extraordinary gaming experiences.
              </p>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-primary" />
                <CardTitle>Current Status</CardTitle>
                <Badge variant="secondary">Bronze Level</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-muted-foreground">
                    Keep playing to reach the next level!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    1,250 / 5,000
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Points to Silver
                  </div>
                </div>
              </div>
              <Progress value={25} className="h-2" />
            </CardContent>
          </Card>

          {/* VIP Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>VIP Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                {vipTiers.map((tier) => (
                  <Card key={tier.level} className={`text-center ${tier.bg}`}>
                    <CardContent className="p-4">
                      <div
                        className={`w-12 h-12 ${tier.bg} rounded-full flex items-center justify-center mx-auto mb-3`}
                      >
                        <Crown className={`w-6 h-6 ${tier.color}`} />
                      </div>
                      <h3 className={`font-bold ${tier.color}`}>{tier.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Level {tier.level}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>VIP Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {benefits.map((benefit, index) => (
                  <Card key={index}>
                    <CardContent className="p-6 text-center">
                      <benefit.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.desc}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* CTA */}
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-2xl font-bold mb-2">Ready to Level Up?</h3>
              <p className="text-muted-foreground mb-6">
                Start playing now and earn VIP points with every bet!
              </p>
              <Button className="w-fit">
                <Trophy className="w-4 h-4 mr-2" />
                Start Playing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
