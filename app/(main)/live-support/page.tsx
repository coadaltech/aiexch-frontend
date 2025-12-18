"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Clock,
  Phone,
  Users,
  CheckCircle,
  Headphones,
} from "lucide-react";

export default function LiveSupport() {
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
            <h1 className="text-3xl font-bold text-primary ">Live Support</h1>
            <Badge
              variant="secondary"
              className="bg-success/20 text-success border-success/30"
            >
              <CheckCircle className="w-3 h-3" />
              Online
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Live Chat Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  <CardTitle>Live Chat Support</CardTitle>
                </div>
                <Badge>Instant Response</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get instant help from our support team. Average response time:
                30 seconds
              </p>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>CS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Customer Support Team</p>
                  <p className="text-xs text-muted-foreground">
                    Available 24/7
                  </p>
                </div>
              </div>
              <Button className="w-fit">
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Live Chat
              </Button>
            </CardContent>
          </Card>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary" />
                  <CardTitle>Email Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-2">support@aiexch.com</p>
                <p className="text-sm text-secondary-foreground mb-2">
                  Send us detailed queries and get comprehensive responses
                </p>
                <Badge variant="outline" className="text-xs">
                  Response within 24 hours
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Phone className="w-6 h-6 text-primary" />
                  <CardTitle>Phone Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-2">+1 (555) 123-4567</p>
                <p className="text-sm text-secondary-foreground mb-2">
                  Speak directly with our support representatives
                </p>
                <Badge variant="outline" className="text-xs">
                  24/7 Available
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  <CardTitle>Support Hours</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-2">24/7 Available</p>
                <p className="text-sm text-secondary-foreground mb-2">
                  Round-the-clock assistance whenever you need help
                </p>
                <Badge
                  variant="secondary"
                  className="bg-success/20 text-success border-success/30 text-xs"
                >
                  Always Online
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Support Team Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <CardTitle>Our Support Team</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">What We Can Help With:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Account verification & KYC
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Deposits & withdrawals
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Game rules & betting help
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Technical issues
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Support Statistics:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Avg. Response Time
                      </span>
                      <Badge>30 sec</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Customer Satisfaction
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-success/20 text-success border-success/30"
                      >
                        98%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Languages Supported
                      </span>
                      <Badge variant="outline">15+</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
