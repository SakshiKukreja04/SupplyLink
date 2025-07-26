import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SL</span>
              </div>
              <span className="text-xl font-semibold text-foreground">SupplyLink</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Connecting suppliers and vendors to create efficient, transparent, and profitable business relationships.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Home
                </Link>
              </li>
              <li>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-smooth">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Contact Us
                </a>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#help" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-foreground transition-smooth">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            Made with ❤️ by the SupplyLink Team. © {new Date().getFullYear()} SupplyLink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;