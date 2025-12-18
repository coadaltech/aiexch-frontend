"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageCircle, HelpCircle } from "lucide-react";
import { faqData } from "@/data";

function FAQCategory({ category }: { category: any }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-primary" />
          <CardTitle>{category.category}</CardTitle>
          <Badge variant="secondary">{category.questions.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {category.questions.map((faq: any, index: number) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <div className="md:px-6 py-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary">
            FAQs
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to the most common questions about our casino platform,
            games, and services.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {faqData.map((category, categoryIndex) => (
            <FAQCategory key={categoryIndex} category={category} />
          ))}
        </div>

        <Separator className="my-8" />

        {/* Contact Section */}
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is available 24/7 to help you with any questions
              or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <a href="/live-support">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:support@aiexch.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
