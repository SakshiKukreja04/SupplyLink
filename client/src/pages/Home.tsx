import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Users, Package, TrendingUp, Shield, Clock, Star } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DeliveryAnimation from '@/components/DeliveryAnimation';
import { initAnimations, cleanupAnimations } from '@/lib/gsap';

const Home: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    initAnimations();
    return () => cleanupAnimations();
  }, []);

  const handleRoleSelection = (role: 'supplier' | 'vendor') => {
    navigate('/signup', { state: { selectedRole: role } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Hero Content */}
            <div className="w-full md:w-1/2 text-left">
              <h1 className="hero-heading text-4xl md:text-6xl font-bold text-foreground mb-6">
                Connect. Trade. 
                <span className="text-primary"> Grow.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
                Join the leading platform that connects suppliers and vendors worldwide. 
                Streamline your business relationships and unlock new opportunities.
              </p>
              {/* Role Selection */}
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start mb-8">
                <Button
                  size="lg"
                  onClick={() => handleRoleSelection('supplier')}
                  className="w-full sm:w-auto min-w-48 h-14 text-lg group transition-smooth"
                >
                  I'm a Supplier
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleRoleSelection('vendor')}
                  className="w-full sm:w-auto min-w-48 h-14 text-lg group transition-smooth"
                >
                  I'm a Vendor
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
            {/* Right: Delivery Animation */}
            <div className="w-full md:w-1/2 flex justify-center items-center mt-10 md:mt-0 relative z-10">
              <DeliveryAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose SupplyLink?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the benefits that make us the preferred choice for businesses worldwide.
            </p>
          </div>

          <div className="card-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* For Suppliers */}
            <Card className="shadow-lg rounded-xl border-0 bg-card hover:shadow-glow-red transition-all duration-300 ease-in-out transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>For Suppliers</CardTitle>
                <CardDescription>Expand your reach and manage inventory efficiently</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3  glow-orange">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Reach vendors across multiple markets</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Real-time inventory management</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Automated order processing</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Secure payment processing</p>
                </div>
              </CardContent>
            </Card>

            {/* For Vendors */}
            <Card className="shadow-lg rounded-xl border-0 bg-card hover:shadow-glow-orange transition-all duration-300 ease-in-out transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>For Vendors</CardTitle>
                <CardDescription>Find reliable suppliers and streamline procurement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Access verified supplier network</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Compare prices and quality</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Simplified ordering process</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Track orders in real-time</p>
                </div>
              </CardContent>
            </Card>

            {/* Platform Features */}
            <Card className="shadow-lg rounded-xl border-0 bg-card md:col-span-2 lg:col-span-1 hover:shadow-glow-ornage transition-all duration-300 ease-in-out transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>Advanced tools to grow your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">24/7 customer support</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Rating and review system</p>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Analytics and insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="cta-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of suppliers and vendors who trust SupplyLink for their business growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto min-w-48 h-14 text-lg">
                Get Started Today
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-48 h-14 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;