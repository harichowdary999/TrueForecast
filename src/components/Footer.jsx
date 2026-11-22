import React from 'react';
import { Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#E7D8C4] bg-[#ebe1d1] py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Left: Copyright */}
        <p className="text-[#5c544b]">© 2026 TrueForecast. All rights reserved.</p>

        {/* Right Links */}
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="#about"
            onClick={(e) => e.preventDefault()}
            className="text-[#5c544b] hover:text-[#1f1d1a] transition-colors"
          >
            About Us
          </a>
          <a
            href="#pricing"
            onClick={(e) => e.preventDefault()}
            className="text-[#5c544b] hover:text-[#1f1d1a] transition-colors"
          >
            Pricing
          </a>
          <a
            href="#contact"
            onClick={(e) => e.preventDefault()}
            className="text-[#5c544b] hover:text-[#1f1d1a] transition-colors"
          >
            Contact Us
          </a>

          <div className="h-4 w-[1px] bg-[#E7D8C4] hidden sm:block" />

          {/* Contact email mailto link */}
          <a
            href="mailto:support@trueforecast.in"
            className="inline-flex items-center gap-1.5 font-medium text-[#5c544b] hover:text-[#1f1d1a] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#5c544b]" />
            <span>support@trueforecast.in</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
