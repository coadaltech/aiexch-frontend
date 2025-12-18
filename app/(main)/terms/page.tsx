"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  UserCheck, 
  AlertTriangle, 
  Scale,
  Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsAndConditions() {
  const router = useRouter();
  return (
    <div className="min-h-screen">
      <div className="md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">
              Terms & Conditions
            </h1>
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 mr-1" />
              Updated 2024
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-primary" />
                <CardTitle>Acceptance of Terms</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing and using AIEXCH, you accept and agree to be bound by
                these terms and conditions. If you do not agree to these terms,
                please do not use our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-primary" />
                <CardTitle>Eligibility</CardTitle>
                <Badge className="bg-info/20 text-info border-info/30">
                  18+ Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You must be at least 18 years old and legally able to enter into
                binding contracts to use our services.
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Must be of legal gambling age in your jurisdiction</li>
                <li>• Must provide valid identification when requested</li>
                <li>• Must not be self-excluded from gambling activities</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <CardTitle>Account Registration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You must provide accurate information during registration and
                maintain the security of your account credentials.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Required Information</h4>
                  <p className="text-sm text-secondary-foreground">
                    Full name, email, phone number, and address
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Account Security</h4>
                  <p className="text-sm text-secondary-foreground">
                    Strong password and two-factor authentication
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle>Responsible Gaming</CardTitle>
                <Badge className="bg-success/20 text-success border-success/30">
                  Safe Gaming
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We promote responsible gaming. Set limits and seek help if
                gambling becomes a problem. Tools are available to help you
                maintain control over your gaming activities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-error" />
                <CardTitle>Prohibited Activities</CardTitle>
                <Badge className="bg-error/20 text-error border-error/30">
                  Strictly Forbidden
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The following activities are strictly prohibited and may result
                in account suspension or termination:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Fraud, money laundering, or any illegal activities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Creating multiple accounts or sharing accounts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Using automated betting systems or bots
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  Attempting to manipulate games or exploit system vulnerabilities
                </li>
              </ul>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardContent className="text-center py-6">
              <h3 className="font-semibold mb-2">Questions About Terms?</h3>
              <p className="text-muted-foreground mb-4">
                Contact our legal team for clarification on any terms or conditions.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:legal@aiexch.com">
                  Contact Legal Team
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}