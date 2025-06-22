import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, DollarSign, Clock, ArrowRight, CheckCircle, Sparkles, Zap, Shield, BarChart3, Star, Award, TrendingUp, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { FeedbackWidget } from '@/components/FeedbackWidget';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Enhanced particles for premium feel */}
      <div className="particles">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-green-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg green-glow">
              <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-black" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              SmartInvoice
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-300 hover:text-green-400 hover:bg-green-500/10 font-medium text-sm sm:text-base">
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold shadow-lg green-glow text-sm sm:text-base">
                Get Started
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center relative z-10 max-w-6xl">
          {/* Premium badge */}
          <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full backdrop-blur-sm">
              <Award className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium text-sm">Professional Invoice Management</span>
              <Star className="w-4 h-4 text-green-400" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in leading-tight">
            Transform Your Business with
            <br />
            <span className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent">
              Smart Invoicing
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Create stunning invoices, automate payments, and grow your business with our 
            AI-powered platform trusted by thousands of professionals worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold text-lg px-8 py-4 shadow-2xl green-glow">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 sm:mt-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-gray-400 text-sm mb-6">Trusted by 10,000+ businesses worldwide</p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-400">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm">Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Updated with Green Theme */}
      <section className="py-16 sm:py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need to Succeed</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Comprehensive invoicing solution with intelligent features designed for modern businesses
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <Card className="bg-green-900/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm group hover:bg-green-900/30">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/30">
                  <FileText className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white text-center">Smart Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-green-muted text-center">
                  AI-powered templates that adapt to your business needs with professional designs and automatic calculations
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-green-900/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm group hover:bg-green-900/30">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/30">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white text-center">Auto Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-green-muted text-center">
                  Intelligent tax calculations with GST, VAT, and multi-currency support for global businesses
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-green-900/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm group hover:bg-green-900/30">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/30">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white text-center">Instant Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-green-muted text-center">
                  Integrated payment links with real-time tracking and automated follow-ups for faster payments
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-green-900/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm group hover:bg-green-900/30">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/30">
                  <BarChart3 className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white text-center">Smart Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-green-muted text-center">
                  Advanced insights and reporting to optimize your business performance and cash flow
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section - Updated with Green Theme */}
      <section className="py-16 sm:py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Loved by Professionals Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-green-900/20 border-green-500/30 p-6 backdrop-blur-sm hover:bg-green-900/30 transition-all duration-300">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "SmartInvoice transformed our billing process. We're getting paid 40% faster!"
              </p>
              <div className="text-white font-medium">Sarah Johnson</div>
              <div className="text-green-muted text-sm">Freelance Designer</div>
            </Card>
            
            <Card className="bg-green-900/20 border-green-500/30 p-6 backdrop-blur-sm hover:bg-green-900/30 transition-all duration-300">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "The AI suggestions save me hours every week. Absolutely game-changing!"
              </p>
              <div className="text-white font-medium">Michael Chen</div>
              <div className="text-green-muted text-sm">Marketing Agency</div>
            </Card>
            
            <Card className="bg-green-900/20 border-green-500/30 p-6 backdrop-blur-sm hover:bg-green-900/30 transition-all duration-300">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "Professional, reliable, and incredibly easy to use. Highly recommended!"
              </p>
              <div className="text-white font-medium">Emma Rodriguez</div>
              <div className="text-green-muted text-sm">Consulting Firm</div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Updated with Green Theme */}
      <section className="py-16 sm:py-20 px-4 relative">
        <div className="container mx-auto text-center max-w-4xl">
          <Card className="bg-gradient-to-br from-green-900/30 to-black/90 border-green-500/30 p-8 sm:p-12 backdrop-blur-sm shadow-2xl hover:border-green-400/50 transition-all duration-300">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of professionals who've streamlined their invoicing and accelerated their growth
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold text-lg px-8 py-4 shadow-2xl green-glow">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 text-sm text-gray-400">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-black via-green-950/60 to-black relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Choose the plan that fits your business. No hidden fees. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="bg-green-900/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-2xl text-white mb-2">Free</CardTitle>
                <div className="text-4xl font-bold text-green-400 mb-2">$0</div>
                <CardDescription className="text-green-muted">For individuals and freelancers just getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-green-muted space-y-3 mb-6">
                  <li>✔️ Unlimited invoices</li>
                  <li>✔️ 3 clients</li>
                  <li>✔️ Basic analytics</li>
                  <li>✔️ Email support</li>
                </ul>
                <Link href="/auth/signup">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-black font-bold">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
            {/* Pro Plan */}
            <Card className="bg-gradient-to-br from-green-600/80 to-green-800/80 border-green-500/50 shadow-2xl scale-105 group">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-2xl text-white mb-2 flex items-center justify-center gap-2">Pro <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 ml-2">Most Popular</Badge></CardTitle>
                <div className="text-4xl font-bold text-yellow-400 mb-2">₹299<span className="text-lg text-gray-300 font-normal">/mo</span></div>
                <CardDescription className="text-green-muted">For growing businesses that need more power</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-green-muted space-y-3 mb-6">
                  <li>✔️ Unlimited invoices & clients</li>
                  <li>✔️ Advanced analytics & reports</li>
                  <li>✔️ Payment reminders & automation</li>
                  <li>✔️ Priority email support</li>
                </ul>
                <Link href="/auth/signup">
                  <Button className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-500">Start Pro Trial</Button>
                </Link>
              </CardContent>
            </Card>
            {/* Business Plan */}
            <Card className="bg-green-900/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-2xl text-white mb-2">Business</CardTitle>
                <div className="text-4xl font-bold text-green-400 mb-2">₹999<span className="text-lg text-gray-300 font-normal">/mo</span></div>
                <CardDescription className="text-green-muted">For teams and enterprises with advanced needs</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-green-muted space-y-3 mb-6">
                  <li>✔️ Everything in Pro</li>
                  <li>✔️ Team management</li>
                  <li>✔️ Custom branding</li>
                  <li>✔️ Dedicated support</li>
                </ul>
                <Link href="/auth/signup">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-black font-bold">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-green-900/20 border-t border-green-500/30 text-white py-12 px-4 backdrop-blur-sm">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-black" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              SmartInvoice
            </span>
          </div>
          <p className="text-gray-400 mb-8 text-lg">
            Professional invoice management for the modern business
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-8">
            <a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-green-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-green-400 transition-colors">Support</a>
            <a href="#" className="hover:text-green-400 transition-colors">API Documentation</a>
            <a href="#" className="hover:text-green-400 transition-colors">Contact</a>
          </div>
          <div className="pt-8 border-t border-green-500/30">
            <p className="text-gray-400 text-sm">
              © 2024 SmartInvoice &nbsp;|&nbsp; Cofounder & CEO: Harsh Bhardwaj
            </p>
          </div>
        </div>
      </footer>

      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}