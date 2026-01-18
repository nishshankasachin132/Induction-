
import React from 'react';
import { User, UserRole, SiteSettings } from '../types.ts';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Award,
  ChevronRight,
  Menu,
  X,
  Eye,
  ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: SiteSettings;
  isAdminPreview?: boolean;
  onTogglePreview?: () => void;
}

export default function Layout({ 
  user, 
  onLogout, 
  children, 
  activeTab, 
  setActiveTab, 
  settings,
  isAdminPreview,
  onTogglePreview
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.USER, UserRole.ADMIN] },
    { id: 'modules', label: 'Induction Modules', icon: BookOpen, roles: [UserRole.USER] },
    { id: 'admin-users', label: 'Manage Users', icon: Users, roles: [UserRole.ADMIN] },
    { id: 'admin-modules', label: 'Manage Content', icon: BookOpen, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Site Settings', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  // If Admin is in Preview mode, they only see User tabs
  const filteredItems = menuItems.filter(item => {
    if (user.role === UserRole.ADMIN && isAdminPreview) {
      return item.roles.includes(UserRole.USER);
    }
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl transition-all duration-300">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center font-bold text-lg">B</div>
             <h1 className="text-xl font-bold tracking-tight uppercase">Best Pacific</h1>
           </div>
           <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Induction Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors group ${
                activeTab === item.id 
                ? 'bg-teal-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          {user.role === UserRole.ADMIN && onTogglePreview && (
            <button 
              onClick={onTogglePreview}
              className={`flex items-center w-full px-4 py-2 text-xs rounded-lg transition-all border ${
                isAdminPreview 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20' 
                : 'bg-teal-500/10 border-teal-500/50 text-teal-400 hover:bg-teal-500/20'
              }`}
            >
              {isAdminPreview ? <Eye className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              {isAdminPreview ? 'Back to Admin Panel' : 'Preview User View'}
            </button>
          )}

          <div className="flex items-center px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-teal-400 mr-3">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-bold">
                {user.role} {isAdminPreview ? '(Previewing)' : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center font-bold text-sm text-white">B</div>
              <span className="font-bold">BEST PACIFIC</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X /> : <Menu />}
           </button>
        </header>

        {/* Header - Global */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">
              {menuItems.find(i => i.id === activeTab)?.label || 'Overview'}
            </h2>
            {isAdminPreview && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-amber-200 tracking-wider">
                Preview Mode
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-sm text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900 md:hidden flex flex-col p-6">
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-white text-xl font-bold">Menu</h1>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white"><X /></button>
            </div>
            <nav className="space-y-4">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className="flex items-center w-full text-white text-lg p-3 rounded-lg hover:bg-slate-800"
                >
                  <item.icon className="mr-4" /> {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto pt-6 border-t border-slate-800">
               <button onClick={onLogout} className="flex items-center w-full text-red-400 p-3">
                 <LogOut className="mr-4" /> Logout
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
