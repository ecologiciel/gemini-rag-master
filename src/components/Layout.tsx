
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, MessageSquareText, Database, Settings, LogOut, Bot, Compass, Menu, Bell, Search, User, Users } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, userRole, children }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Analytics Overview', icon: LayoutDashboard },
    { id: ViewState.STRATEGY, label: 'Strategy Streams', icon: Compass },
    { id: ViewState.CHAT, label: 'Inbox / Chat', icon: MessageSquareText },
    { id: ViewState.KNOWLEDGE, label: 'Content Library', icon: Database },
    // Only show Settings & Users to Admin
    ...(userRole === 'admin' ? [
        { id: ViewState.SETTINGS, label: 'Account & Settings', icon: Settings },
        { id: ViewState.USERS, label: 'Team Management', icon: Users }
    ] : []),
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Display Name
  const userInitial = userRole === 'admin' ? 'AD' : 'US';
  const displayRole = userRole === 'admin' ? 'Administrator' : 'Standard User';

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans">
      {/* Sidebar - Style Hootsuite Dark Navy */}
      <div className="w-64 bg-[#0F172A] text-slate-300 flex flex-col flex-shrink-0 z-30 transition-all duration-300">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 bg-[#1E293B] border-b border-slate-700 shadow-sm">
          <button 
            onClick={() => onChangeView(ViewState.DASHBOARD)}
            className="flex items-center space-x-3 hover:opacity-90 transition-opacity focus:outline-none"
          >
             <div className="bg-indigo-600 p-1.5 rounded flex items-center justify-center">
                 <Bot className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-white tracking-wide text-lg">RAG<span className="font-light opacity-80">Master</span></span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1">
          {navItems.map((item) => {
             const isActive = currentView === item.id;
             return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors duration-150 border-l-4 ${
                    isActive
                      ? 'bg-[#1E293B] text-white border-indigo-500'
                      : 'border-transparent hover:bg-[#1E293B] hover:text-white hover:border-slate-600'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
             );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-700 bg-[#0F172A]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - Enterprise Style */}
        <header className="bg-white h-16 border-b border-slate-300 flex items-center justify-between px-8 shadow-sm z-20">
            {/* Breadcrumb / Title */}
            <div className="flex items-center text-slate-800">
                <span className="text-slate-400 font-medium mr-2">Organization</span>
                <span className="text-slate-300 mx-2">/</span>
                <h2 className="font-bold text-lg capitalize tracking-tight">
                    {currentView.toLowerCase().replace(/_/g, ' ')}
                </h2>
            </div>

            {/* Top Right Utilities */}
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Quick search..." className="pl-9 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 transition-all" />
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <button className="text-slate-500 hover:text-slate-700 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                
                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs border transition-all ${userRole === 'admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:ring-2 hover:ring-indigo-500/20' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                    >
                        {userInitial}
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-sm font-bold text-slate-800">{userRole === 'admin' ? 'Admin User' : 'Standard User'}</p>
                                <p className="text-xs text-slate-500 truncate capitalize">{userRole}</p>
                            </div>
                            <button 
                                onClick={() => { onChangeView(ViewState.PROFILE); setIsProfileOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <User className="w-4 h-4" /> My Profile
                            </button>
                            
                            {/* Settings only for Admin in dropdown */}
                            {userRole === 'admin' && (
                                <>
                                    <button 
                                        onClick={() => { onChangeView(ViewState.SETTINGS); setIsProfileOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Settings className="w-4 h-4" /> Settings
                                    </button>
                                    <button 
                                        onClick={() => { onChangeView(ViewState.USERS); setIsProfileOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Users className="w-4 h-4" /> Team Management
                                    </button>
                                </>
                            )}

                            <div className="border-t border-slate-100 my-1"></div>
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F0F2F5]">
            <div className="max-w-[1600px] mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
    