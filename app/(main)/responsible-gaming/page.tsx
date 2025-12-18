"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Clock,
  DollarSign,
  Phone,
  ArrowLeft,
  AlertTriangle,
  Heart,
  Settings,
} from "lucide-react";

export default function ResponsibleGaming() {
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
            <h1 className="text-3xl font-bold text-primary">
              Responsible Gaming
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary" />
                <CardTitle>Gaming Should Be Fun</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We are committed to promoting responsible gaming and providing
                tools to help you stay in control. Gaming should always be
                entertaining, never a source of stress or financial hardship.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-primary" />
                  <CardTitle>Set Limits</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Set daily, weekly, or monthly deposit limits to control your
                  spending.
                </p>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Limits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  <CardTitle>Time Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Set session time limits and take regular breaks from gaming.
                </p>
                <Button size="sm" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Set Time Limits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <CardTitle>Self-Exclusion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Temporarily or permanently exclude yourself from gaming
                  activities.
                </p>
                <Button size="sm" variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Self-Exclude
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Phone className="w-6 h-6 text-primary" />
                  <CardTitle>Get Help</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Contact support or gambling addiction helplines if you need
                  assistance.
                </p>
                <Button size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-error" />
                <CardTitle>Warning Signs</CardTitle>
                <Badge className="bg-error/20 text-error border-error/30">
                  Important
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Be aware of these warning signs that may indicate problematic
                gaming behavior:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Spending more money than you can afford
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Chasing losses with bigger bets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Neglecting work, family, or social activities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Feeling anxious or depressed about gambling
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <h3 className="font-semibold mb-2">Need Immediate Help?</h3>
              <p className="text-muted-foreground mb-4">
                If you or someone you know has a gambling problem, help is
                available 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <a href="tel:1-800-522-4700">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 1-800-522-4700
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://www.ncpgambling.org" target="_blank">
                    Visit NCPG.org
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
