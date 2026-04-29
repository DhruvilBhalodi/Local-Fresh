import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf, Sun, Moon, Menu, X, BarChart3, LogIn, UserPlus, LogOut, LayoutDashboard
} from 'lucide-react';
import { useTheme } from '../App';
import { useAuth } from '../App';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className="navbar glass">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
          <div className="logo-icon">
            <Leaf size={20} />
          </div>
          <span className="logo-text font-display">
            Local<span className="text-gradient">Fresh</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links hide-mobile">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
        </div>

        {/* Desktop Actions */}
        <div className="navbar-actions hide-mobile">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                <LayoutDashboard size={14} /> Dashboard
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="mobile-controls">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu glass animate-fade-in">
          <Link to="/" className="mobile-link" onClick={() => setMobileOpen(false)}>Home</Link>
          <a href="#features" className="mobile-link" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#how-it-works" className="mobile-link" onClick={() => setMobileOpen(false)}>How It Works</a>
          <a href="#stats" className="mobile-link" onClick={() => setMobileOpen(false)}>Impact</a>
          <div className="mobile-divider" />
          {user ? (
            <>
              <Link to="/dashboard" className="mobile-link" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button className="mobile-link danger" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>
                <LogIn size={16} /> Login
              </Link>
              <Link to="/register" className="mobile-link accent" onClick={() => setMobileOpen(false)}>
                <UserPlus size={16} /> Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
