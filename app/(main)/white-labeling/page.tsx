"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Palette, Settings, Zap, Globe, Shield, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useSubmitWhitelabelRequest } from "@/hooks/usePublic";

export default function WhiteLabeling() {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contactEmail: '',
    primaryColor: '#D4AF37',
    secondaryColor: '#1a1a1a'
  });
  
  const submitRequest = useSubmitWhitelabelRequest();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRequest.mutate(formData);
  };
  
  return (
    <div className="min-h-screen">
      <div className=" md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            size="sm"
            className="text-casino-primary-text hover:bg-casino-dark"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-4xl font-bold text-casino-primary">White Label Solutions</h1>
        </div>
        <div className="text-start mb-12">
          <p className="text-xl text-casino-secondary-text  mx-auto">
            Launch your own branded casino platform with our comprehensive white label solution. 
            Get to market faster with our proven technology and customizable features.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-casino-dark border-casino-primary/30 p-6">
            <Palette className="w-12 h-12 text-casino-primary mb-4" />
            <h3 className="text-xl font-semibold text-casino-primary-text mb-3">Full Customization</h3>
            <p className="text-casino-secondary-text">Complete branding control with custom logos, colors, themes, and UI elements to match your brand identity.</p>
          </Card>

          <Card className="bg-casino-dark border-casino-primary/30 p-6">
            <Zap className="w-12 h-12 text-casino-primary mb-4" />
            <h3 className="text-xl font-semibold text-casino-primary-text mb-3">Quick Launch</h3>
            <p className="text-casino-secondary-text">Get your casino live in 30 days with our pre-built platform and streamlined setup process.</p>
          </Card>

          <Card className="bg-casino-dark border-casino-primary/30 p-6">
            <Globe className="w-12 h-12 text-casino-primary mb-4" />
            <h3 className="text-xl font-semibold text-casino-primary-text mb-3">Multi-Language</h3>
            <p className="text-casino-secondary-text">Support for 20+ languages and currencies to reach global markets effectively.</p>
          </Card>

          <Card className="bg-casino-dark border-casino-primary/30 p-6">
            <Shield className="w-12 h-12 text-casino-primary mb-4" />
            <h3 className="text-xl font-semibold text-casino-primary-text mb-3">Licensed & Secure</h3>
            <p className="text-casino-secondary-text">Fully licensed platform with advanced security, SSL encryption, and compliance tools.</p>
          </Card>

          <Card className="bg-casino-dark border-casino-primary/30 p-6">
            <Settings className="w-12 h-12 text-casino-primary mb-4" />
            <h3 className="text-xl font-semibold text-casino-primary-text mb-3">Admin Panel</h3>
            <p className="text-casino-secondary-text">Comprehensive management dashboard for users, games, payments, and analytics.</p>
          </Card>

          <Card className="bg-casino-dark border-casino-primary/30 p-6">
            <CheckCircle className="w-12 h-12 text-casino-primary mb-4" />
            <h3 className="text-xl font-semibold text-casino-primary-text mb-3">24/7 Support</h3>
            <p className="text-casino-secondary-text">Dedicated technical support and account management to ensure smooth operations.</p>
          </Card>
        </div>

        {/* What's Included */}
        <Card className="bg-casino-dark border-casino-primary/30 p-8 mb-12">
          <h2 className="text-3xl font-bold text-casino-primary mb-6 text-center">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-casino-primary-text mb-4">Platform Features</h3>
              <ul className="space-y-2 text-casino-secondary-text">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 500+ Casino Games</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Live Dealer Games</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Sports Betting</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Mobile Responsive</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Payment Gateway Integration</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> KYC/AML Compliance</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-casino-primary-text mb-4">Business Tools</h3>
              <ul className="space-y-2 text-casino-secondary-text">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Player Management System</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Bonus & Promotion Engine</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Real-time Analytics</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Risk Management Tools</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Affiliate System</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Customer Support Tools</li>
              </ul>
            </div>
          </div>
        </Card>



        {/* Request Form */}
        <Card className="bg-casino-dark border-casino-primary/30 p-8 mb-12">
          <h2 className="text-3xl font-bold text-casino-primary mb-6 text-center">Request Your White Label Solution</h2>
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-casino-primary-text">Business Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-casino-darker border-casino-primary/30 text-casino-primary-text"
                  required
                />
              </div>
              <div>
                <Label htmlFor="domain" className="text-casino-primary-text">Desired Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  className="bg-casino-darker border-casino-primary/30 text-casino-primary-text"
                  placeholder="example.com"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-casino-primary-text">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                className="bg-casino-darker border-casino-primary/30 text-casino-primary-text"
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primaryColor" className="text-casino-primary-text">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                  className="bg-casino-darker border-casino-primary/30 h-12"
                />
              </div>
              <div>
                <Label htmlFor="secondaryColor" className="text-casino-primary-text">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                  className="bg-casino-darker border-casino-primary/30 h-12"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={submitRequest.isPending}
              className="w-full bg-casino-primary text-black hover:bg-casino-primary/80 py-3"
            >
              {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </Card>

        {/* CTA Section */}
        <Card className="bg-casino-dark border-casino-primary/30 p-8 text-center">
          <h2 className="text-3xl font-bold text-casino-primary mb-4">Ready to Launch Your Casino?</h2>
          <p className="text-xl text-casino-secondary-text mb-6 max-w-2xl mx-auto">
            Join 100+ successful operators who chose our white label solution. 
            Get a free demo and see how we can help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-casino-primary text-black hover:bg-casino-primary/80 px-8 py-3">
              Schedule Demo
            </Button>
            <Button variant="outline" className="border-casino-primary text-casino-primary hover:bg-casino-primary hover:text-black px-8 py-3">
              Download Brochure
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
