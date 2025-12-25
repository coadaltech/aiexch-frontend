"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Lock, Eye, Users, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <div className="min-h-screen">
      <div className="md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 text-primary" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
            <Badge variant="secondary">Updated 2024</Badge>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <CardTitle>Information We Collect</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We collect personal information you provide during registration,
                including name, email, and payment details.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Personal identification information</li>
                <li>• Contact information (email, phone)</li>
                <li>• Payment and billing information</li>
                <li>• Gaming activity and preferences</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <CardTitle>How We Use Your Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your information is used to provide services, process
                transactions, and ensure account security.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Service Provision</h4>
                  <p className="text-sm text-secondary-foreground">
                    Account management and game access
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Security</h4>
                  <p className="text-sm text-secondary-foreground">
                    Fraud prevention and account protection
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle>Data Security</CardTitle>
                <Badge className="bg-success/20 text-success border-success/30">
                  SSL Encrypted
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We use 256-bit SSL encryption and industry-standard security
                measures to protect your data.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">
                  Bank-level encryption standards
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" />
                <CardTitle>Third-Party Sharing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We do not sell or share your personal information with third
                parties except as required by law or with your explicit consent.
              </p>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You have the right to access, update, or delete your personal
                information at any time.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Data Access</Badge>
                <Badge variant="outline">Data Portability</Badge>
                <Badge variant="outline">Data Deletion</Badge>
                <Badge variant="outline">Opt-out Rights</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <h3 className="font-semibold mb-2">Questions About Privacy?</h3>
              <p className="text-muted-foreground mb-4">
                Contact our privacy team for any questions or concerns.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:privacy@aiexch.com">Contact Privacy Team</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
