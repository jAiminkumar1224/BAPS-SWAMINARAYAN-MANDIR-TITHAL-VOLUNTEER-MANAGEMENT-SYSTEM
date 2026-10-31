import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Layers,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  CreditCard,
  Bell,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, isSuperAdmin, isItVolunteer, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (isSuperAdmin && isSupabaseConfigured) {
      const checkPendingRequests = async () => {
        try {
          const { count } = await supabase
            .from('admin_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'it_volunteer')
            .eq('status', 'pending');
          setPendingCount(count || 0);
        } catch {
          // ignore
        }
      };
      checkPendingRequests();
      const interval = setInterval(checkPendingRequests, 15000);
      return () => clearInterval(interval);
    }
  }, [isSuperAdmin]);

  interface NavLinkItem {
    to: string;
    label: string;
    icon: any;
    badge?: number;
  }

  const navLinks: NavLinkItem[] = [
    { to: '/dashboard', label: 'ડેશબોર્ડ', icon: LayoutDashboard },
    { to: '/create', label: 'નવું આઈડી કાર્ડ', icon: UserPlus },
    { to: '/volunteers', label: 'તમામ સ્વયંસેવકો', icon: Users },
  ];

  // IT Volunteers are not allowed to manage or add Seva Vibhags
  if (!isItVolunteer) {
    navLinks.push({ to: '/departments', label: 'સેવા વિભાગ વ્યવસ્થાપન', icon: Layers });
  }

  if (isSuperAdmin) {
    navLinks.push({
      to: '/admins',
      label: 'એડમિન વ્યવસ્થાપન',
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white shadow-lg sticky top-0 z-40 border-b-2 border-[#C59B27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white/10 rounded-full p-1 border border-amber-300 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BAPS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight block text-amber-100 group-hover:text-white transition">
                BAPS તીથલ
              </span>
              <span className="text-[11px] text-amber-200/90 block leading-tight font-medium">
                સ્વયંસેવક આઈડી કાર્ડ પોર્ટલ
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link: any) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition relative ${
                    active
                      ? 'bg-amber-600/50 text-white shadow-sm border border-amber-300/40'
                      : 'text-amber-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-300" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-[11px] font-black bg-amber-400 text-red-950 rounded-full shadow animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {isSuperAdmin && pendingCount > 0 && (
              <Link
                to="/admins"
                title={`${pendingCount} નવી IT સ્વયંસેવક વિનંતી મંજૂરી માટે પેન્ડિંગ છે`}
                className="relative p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-400/40 transition"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              </Link>
            )}

            <div className="text-right">
              <span className="text-xs text-amber-200 block font-semibold">
                {profile?.role === 'super_admin'
                  ? 'સુપર એડમિન'
                  : profile?.role === 'it_volunteer'
                  ? 'SSD IT સ્વયંસેવક'
                  : 'એડમિન'}
              </span>
              <span className="text-xs font-bold text-white max-w-[140px] truncate block">
                {profile?.full_name || user?.email || 'સ્વયંસેવક'}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              title="લોગઆઉટ"
              className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-amber-200 hover:text-white border border-amber-400/30 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>લોગઆઉટ</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isSuperAdmin && pendingCount > 0 && (
              <Link
                to="/admins"
                className="relative p-1.5 rounded-lg bg-amber-500/20 text-amber-300"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full animate-ping" />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-amber-200 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#5E0000] border-t border-amber-500/30 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link: any) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  active
                    ? 'bg-amber-600/40 text-white border border-amber-400/30'
                    : 'text-amber-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 text-amber-300" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-300 block">
                {profile?.role === 'super_admin'
                  ? 'સુપર એડમિન'
                  : profile?.role === 'it_volunteer'
                  ? 'SSD IT સ્વયંસેવક'
                  : 'એડમિન'}
              </span>
              <span className="text-xs font-bold text-white">
                {profile?.full_name || user?.email}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-lg bg-red-900/60 text-red-200 hover:text-white text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>લોગઆઉટ</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
