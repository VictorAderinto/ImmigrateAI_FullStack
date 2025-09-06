import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../utils/auth";
import { Menu, X, ChevronDown, MessageSquare, FileText, User } from "lucide-react";
import LanguageSelector from "./LanguageSelector";

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };


  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
  };

  const handlePathwayClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    navigate('/application-select');
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-md"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center flex-shrink-0">
            <Link to="/">
              <div className="flex items-center">
                <img src="/immentra-logo.png" alt="Immigration AI Logo" className="h-16 w-auto mr-2" />
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:ml-10 md:flex space-x-1">
            {/* Permit Type Dropdown */}
            <div className="relative group">
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md">
                Pathways
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <button 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    onClick={() => handlePathwayClick()}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 mr-3`}>
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Work Permit</p>
                      <p className="text-xs text-gray-500">For temporary work in Canada</p>
                    </div>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    onClick={() => handlePathwayClick()}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 mr-3`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Study Permit</p>
                      <p className="text-xs text-gray-500">For international students</p>
                    </div>
                  </button>
                  <button 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    onClick={() => handlePathwayClick()}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 mr-3`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Permanent Residence</p>
                      <p className="text-xs text-gray-500">For long-term immigration</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Resources (greyed out) */}
            <button
              className="px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-md"
              aria-disabled="true"
              tabIndex={-1}
            >
              Resources
            </button>

            {/* Consultant Connect (greyed out) */}
            <button
              className="px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-md"
              aria-disabled="true"
              tabIndex={-1}
            >
              Consultant Connect
            </button>

            <button 
              className={`px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md`}
              onClick={() => {
                const isOnHomePage = location.pathname === "/";
                if (isOnHomePage) {
                  document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.href = "/#about-us";
                }
              }}
            >
              About Us
            </button>
          </nav>
        </div>

        <div className="flex items-center">
          {/* Language Selector */}
          <LanguageSelector />
          
          {isLoggedIn ? (
            <div className="flex items-center ml-4">
              <div className="relative group">
                <button className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-md" id="account-menu-btn">
                  <User className="h-6 w-6 text-gray-700" />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Log out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ml-4 flex items-center space-x-2">
              <Link to="/login">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm">
                  Register
                </button>
              </Link>
            </div>
          )}
          
          {/* Mobile menu button */}
          <div className="ml-4 md:hidden">
            <button onClick={toggleMobileMenu} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md">
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pathways
            </div>
            <button 
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 w-full text-left`}
              onClick={() => {
                handlePathwayClick();
                setMobileMenuOpen(false);
              }}
            >
              <FileText className="mr-3 h-5 w-5" />
              Work Permit
            </button>
            <button 
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 w-full text-left`}
              onClick={() => {
                handlePathwayClick();
                setMobileMenuOpen(false);
              }}
            >
              <FileText className="mr-3 h-5 w-5" />
              Study Permit
            </button>
            <button 
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 w-full text-left`}
              onClick={() => {
                handlePathwayClick();
                setMobileMenuOpen(false);
              }}
            >
              <User className="mr-3 h-5 w-5" />
              Permanent Residence
            </button>
            <div className="border-t border-gray-200 my-2"></div>
            <Link to="/resources">
              <div className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive("/resources") ? "bg-red-50 text-red-600" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"}`}>
                Resources
              </div>
            </Link>
            <Link to="/consultants">
              <div className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive("/consultants") ? "bg-red-50 text-red-600" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"}`}>
                Consultant Connect
              </div>
            </Link>
            <div 
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer`}
              onClick={() => {
                const isOnHomePage = location.pathname === "/";
                if (isOnHomePage) {
                  document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                } else {
                  window.location.href = "/#about-us";
                }
              }}
            >
              About Us
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 