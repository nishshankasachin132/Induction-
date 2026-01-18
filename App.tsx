
import React from 'react';
import { User, UserRole, Module, UserProgress, SiteSettings, AuthState, Attachment } from './types.ts';
import { db } from './store.ts';
import Layout from './components/Layout.tsx';
import ModuleViewer from './components/ModuleViewer.tsx';
import CertificateGenerator from './components/CertificateGenerator.tsx';
import { 
  Users, 
  Settings, 
  Trash2, 
  BarChart, 
  Download, 
  UserPlus, 
  AlertCircle,
  HelpCircle,
  X,
  Plus,
  BookOpen,
  Award,
  Upload,
  Save,
  Info,
  ChevronRight,
  Eye,
  FileText,
  Edit2,
  Files,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [isAdminPreview, setIsAdminPreview] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPass, setLoginPass] = React.useState('');
  const [loginError, setLoginError] = React.useState('');

  // App Data State
  const [users, setUsers] = React.useState<User[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [progress, setProgress] = React.useState<UserProgress[]>([]);
  const [settings, setSettings] = React.useState<SiteSettings>(db.getSettings());
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
  // Modals / Forms
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [showAddModuleModal, setShowAddModuleModal] = React.useState(false);

  // New User Form State
  const [newUser, setNewUser] = React.useState({ email: '', fullName: '', role: UserRole.USER, password: '' });
  
  // New/Edit Module Form State
  const [newModule, setNewModule] = React.useState<Partial<Module>>({ title: '', description: '', attachments: [] });
  const [editingModuleId, setEditingModuleId] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // Load Initial Data
  React.useEffect(() => {
    setUsers(db.getUsers());
    setModules(db.getModules());
    setProgress(db.getProgress());
  }, []);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    // Only allow login if user exists and password matches
    if (foundUser && foundUser.password === loginPass) {
      setAuthState({ user: foundUser, isAuthenticated: true });
      if (foundUser.isFirstLogin && foundUser.role === UserRole.USER) {
        setShowOnboarding(true);
      }
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Access restricted to authorized personnel.');
    }
  };

  const handleLogout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    setIsAdminPreview(false);
    setActiveTab('dashboard');
  };

  const markModuleComplete = (moduleId: string) => {
    if (!authState.user) return;
    const existing = progress.find(p => p.moduleId === moduleId && p.userId === authState.user!.id);
    if (existing) return;

    const newProg: UserProgress = {
      userId: authState.user.id,
      moduleId,
      isCompleted: true,
      dateCompleted: new Date().toISOString()
    };
    const updated = [...progress, newProg];
    setProgress(updated);
    db.setProgress(updated);
  };

  const calculateProgress = (userId: string) => {
    const userProg = progress.filter(p => p.userId === userId && p.isCompleted);
    return modules.length > 0 ? Math.round((userProg.length / modules.length) * 100) : 0;
  };

  // User Actions
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userObj: User = {
      id: `u-${Date.now()}`,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      password: newUser.password || 'temp123',
      joinedDate: new Date().toISOString().split('T')[0],
      isFirstLogin: true
    };
    const updated = [...users, userObj];
    setUsers(updated);
    db.setUsers(updated);
    setShowAddUserModal(false);
    setNewUser({ email: '', fullName: '', role: UserRole.USER, password: '' });
  };

  const deleteUser = (userId: string) => {
    if(confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      db.setUsers(updated);
    }
  };

  // Module Actions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'attachment' | 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'attachment') {
        const newAtt: Attachment = {
          id: `a-${Date.now()}`,
          title: file.name,
          url: result,
          type: file.type || 'application/octet-stream',
          canDownload: true // Default to true, admin can toggle
        };
        setNewModule(prev => ({ 
          ...prev, 
          attachments: [...(prev.attachments || []), newAtt] 
        }));
      } else if (target === 'logo') {
        const s = { ...settings, logoUrl: result };
        setSettings(s);
        db.setSettings(s);
      } else if (target === 'hero') {
        const s = { ...settings, heroImageUrl: result };
        setSettings(s);
        db.setSettings(s);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleAttachmentPermission = (attId: string) => {
    setNewModule(prev => ({
      ...prev,
      attachments: prev.attachments?.map(a => a.id === attId ? { ...a, canDownload: !a.canDownload } : a)
    }));
  };

  const removeAttachment = (attId: string) => {
    setNewModule(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(a => a.id !== attId)
    }));
  };

  const handleAddModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModule.attachments || newModule.attachments.length === 0) {
      alert('Please upload at least one attachment.');
      return;
    }

    if (editingModuleId) {
      const updated = modules.map(m => m.id === editingModuleId ? {
        ...m,
        title: newModule.title || m.title,
        description: newModule.description || m.description,
        attachments: newModule.attachments || m.attachments
      } : m);
      setModules(updated);
      db.setModules(updated);
    } else {
      const modObj: Module = {
        id: `m-${Date.now()}`,
        title: newModule.title || 'Untitled Module',
        description: newModule.description || '',
        orderIndex: modules.length,
        attachments: newModule.attachments || []
      };
      const updated = [...modules, modObj];
      setModules(updated);
      db.setModules(updated);
    }
    
    setShowAddModuleModal(false);
    setEditingModuleId(null);
    setNewModule({ title: '', description: '', attachments: [] });
  };

  const handleEditModule = (module: Module) => {
    setNewModule({
      title: module.title,
      description: module.description,
      attachments: module.attachments
    });
    setEditingModuleId(module.id);
    setShowAddModuleModal(true);
  };

  const exportUsersCSV = () => {
    const headers = ['FullName', 'Email', 'Role', 'Password', 'JoinedDate', 'Completion%'];
    const rows = users.map(u => [
      u.fullName,
      u.email,
      u.role,
      u.password || 'N/A',
      u.joinedDate,
      `${calculateProgress(u.id)}%`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Best_Pacific_Employee_Data.csv`);
    link.click();
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl mb-6 shadow-lg shadow-teal-500/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Best Pacific Textiles</h1>
            <p className="text-slate-400 mt-2 font-medium tracking-wide">Induction Portal Access</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-800/50 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Corporate Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-teal-500 focus:outline-none transition-all"
                placeholder="admin@bestpacific.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-teal-500 focus:outline-none transition-all"
                placeholder="Enter admin password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
            >
              Secure Login
            </button>

            <p className="text-center text-[10px] text-slate-400 font-medium pt-2">
              Authorized access only. Technical issues? Contact HR.
            </p>
          </form>
        </div>
      </div>
    );
  }

  const user = authState.user!;
  const userCompletion = calculateProgress(user.id);
  const isActualAdmin = user.role === UserRole.ADMIN;
  const isViewingAsUser = !isActualAdmin || isAdminPreview;

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      settings={settings}
      isAdminPreview={isAdminPreview}
      onTogglePreview={isActualAdmin ? () => setIsAdminPreview(!isAdminPreview) : undefined}
    >
      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Employee</h2>
              <button onClick={() => setShowAddUserModal(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Corporate Email</label>
                <input type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="name@bestpacific.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Login Password</label>
                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Set initial password" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                  <option value={UserRole.USER}>User (New Hire)</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl mt-4 shadow-lg shadow-teal-500/20 active:scale-95 transition-all">Save Employee</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODULE MODAL */}
      {showAddModuleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingModuleId ? 'Edit Training Module' : 'New Induction Module'}</h2>
              <button onClick={() => { setShowAddModuleModal(false); setEditingModuleId(null); setNewModule({ title: '', description: '', attachments: [] }); }}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddModuleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Module Title</label>
                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Brief Description</label>
                <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-20" value={newModule.description} onChange={e => setNewModule({...newModule, description: e.target.value})} />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Training Assets</label>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{newModule.attachments?.length || 0} Files</span>
                </div>
                
                {/* Existing Attachments List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {newModule.attachments?.map((att) => (
                    <div key={att.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 group">
                       <div className="flex items-center gap-3 min-w-0">
                         <div className="p-2 bg-white rounded-lg text-teal-600 shadow-sm"><FileText className="w-4 h-4" /></div>
                         <div className="min-w-0">
                           <p className="text-xs font-bold text-slate-800 truncate">{att.title}</p>
                           <p className="text-[9px] text-slate-400 uppercase font-black">{att.type.split('/')[1]}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Download</span>
                            <button 
                              type="button"
                              onClick={() => toggleAttachmentPermission(att.id)}
                              className={`w-8 h-4 rounded-full relative transition-colors ${att.canDownload ? 'bg-teal-500' : 'bg-slate-300'}`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${att.canDownload ? 'translate-x-4.5' : 'translate-x-0.5'}`}></div>
                            </button>
                         </div>
                         <button type="button" onClick={() => removeAttachment(att.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ))}
                </div>

                {/* Upload Button */}
                <label className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isUploading ? 'bg-teal-50 border-teal-500' : 'bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'}`}>
                  {isUploading ? <BarChart className="w-6 h-6 animate-pulse text-teal-600" /> : <Upload className="w-6 h-6 text-slate-400" />}
                  <div className="text-center">
                     <p className="text-xs font-bold text-slate-600">{isUploading ? 'Processing...' : 'Click to add more files'}</p>
                     <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">PDF, Image, Video, PPT</p>
                  </div>
                  <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'attachment')} />
                </label>
              </div>

              <button type="submit" disabled={isUploading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl mt-2 disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-slate-900/10">
                {isUploading ? 'Please wait...' : editingModuleId ? 'Update Module Curriculum' : 'Create Module'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Induction Dashboard</h1>
              <p className="text-slate-500 mt-1 text-lg">Greetings, <span className="text-teal-600 font-bold">{user.fullName}</span>!</p>
            </div>
            {isViewingAsUser && (
               <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6 group hover:shadow-md transition-shadow">
                 <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Progress</p>
                   <p className="text-3xl font-black text-slate-800">{userCompletion}%</p>
                 </div>
                 <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-teal-500 group-hover:rotate-180 transition-transform duration-700"></div>
               </div>
            )}
          </div>

          {/* Hero */}
          <div className="relative h-72 rounded-3xl overflow-hidden shadow-2xl">
            <img src={settings.heroImageUrl} className="w-full h-full object-cover" alt="Corporate" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent flex items-center p-12">
               <div className="max-w-md text-white space-y-4">
                 <div className="inline-block px-3 py-1 bg-teal-500 rounded text-[10px] font-black uppercase tracking-widest">Official Induction</div>
                 <h3 className="text-4xl font-bold leading-tight">Empowering Innovation, Together.</h3>
                 <p className="text-slate-300 font-medium">Start your professional journey with Best Pacific Textiles Lanka.</p>
                 <button onClick={() => setActiveTab('modules')} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold text-sm hover:bg-teal-50 transition-colors shadow-lg">Begin Modules</button>
               </div>
            </div>
          </div>

          {/* Stats / User View */}
          {isViewingAsUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-teal-600" /> Assigned Training</h4>
                  <button onClick={() => setActiveTab('modules')} className="text-xs font-bold text-teal-600 hover:underline uppercase tracking-widest">Explore Modules</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.slice(0, 4).map((m, i) => (
                    <div key={m.id} className="p-5 bg-white rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-lg transition-all group cursor-pointer" onClick={() => setActiveTab('modules')}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${progress.some(p => p.moduleId === m.id && p.userId === user.id) ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Files className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-teal-600">{m.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mt-1">
                          {m.attachments.length} Resources • {progress.some(p => p.moduleId === m.id && p.userId === user.id) ? 'Completed ✓' : 'In Progress'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                 {userCompletion === 100 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <CertificateGenerator user={user} settings={settings} />
                    </div>
                 ) : (
                   <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-6 shadow-sm">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner"><Award className="w-10 h-10 text-slate-300" /></div>
                      <div>
                        <h4 className="font-bold text-slate-800">Induction Certificate</h4>
                        <p className="text-slate-500 text-sm mt-1">Achieve 100% completion to unlock your official certification.</p>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-full transition-all duration-1000 ease-out" style={{ width: `${userCompletion}%` }}></div>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{userCompletion}% Completed</p>
                   </div>
                 )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('admin-users')}>
                <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-teal-50 text-teal-600 rounded-2xl shadow-sm"><Users className="w-6 h-6" /></div><h5 className="font-black text-slate-400 uppercase tracking-widest text-[11px]">Total Workforce</h5></div>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{users.length}</p>
                  <span className="text-teal-600 font-bold text-sm">Active Personnel</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('admin-modules')}>
                <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm"><BookOpen className="w-6 h-6" /></div><h5 className="font-black text-slate-400 uppercase tracking-widest text-[11px]">Active Modules</h5></div>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{modules.length}</p>
                  <span className="text-blue-600 font-bold text-sm">Modules Live</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-orange-50 text-orange-600 rounded-2xl shadow-sm"><Award className="w-6 h-6" /></div><h5 className="font-black text-slate-400 uppercase tracking-widest text-[11px]">Onboarding KPI</h5></div>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{users.filter(u => calculateProgress(u.id) === 100).length}</p>
                  <span className="text-orange-600 font-bold text-sm">Certified</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULES TAB (User View) */}
      {activeTab === 'modules' && (
        <ModuleViewer modules={modules} progress={progress.filter(p => p.userId === user.id)} onComplete={markModuleComplete} />
      )}

      {/* ADMIN USERS TAB */}
      {activeTab === 'admin-users' && (
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div><h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personnel Directory</h2><p className="text-slate-500">Monitor employee induction journey and export records.</p></div>
             <div className="flex gap-2 w-full sm:w-auto">
               <button onClick={exportUsersCSV} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"><Download className="w-4 h-4" /> Export Report</button>
               <button onClick={() => setShowAddUserModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 active:scale-95"><UserPlus className="w-4 h-4" /> Add Employee</button>
             </div>
           </div>
           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name & Identity</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Induction Status</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credential</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Admin Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors shadow-inner">{u.fullName.charAt(0)}</div><div><p className="font-bold text-slate-800 text-sm">{u.fullName}</p><p className="text-[10px] font-medium text-slate-400 lowercase">{u.email}</p></div></div></td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{u.role}</span></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden max-w-[80px] shadow-inner"><div className="bg-teal-500 h-full transition-all duration-700" style={{ width: `${calculateProgress(u.id)}%` }}></div></div><span className="text-[10px] font-black text-slate-700">{calculateProgress(u.id)}%</span></div></td>
                        <td className="px-6 py-4"><code className="text-[10px] bg-slate-50 px-2 py-1 rounded font-mono text-slate-500">{u.password || '******'}</code></td>
                        <td className="px-6 py-4 text-right"><button disabled={u.role === UserRole.ADMIN} onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0 active:scale-90"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                 </tbody>
               </table>
           </div>
        </div>
      )}

      {/* ADMIN MODULES TAB */}
      {activeTab === 'admin-modules' && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
             <div><h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Curriculum CMS</h2><p className="text-slate-500">Manage training assets and multi-file modules.</p></div>
             <button onClick={() => { setEditingModuleId(null); setNewModule({ title: '', description: '', attachments: [] }); setShowAddModuleModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl transition-all active:scale-95 text-sm"><Plus className="w-4 h-4" /> New Module</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {modules.sort((a,b) => a.orderIndex - b.orderIndex).map((m, idx) => (
               <div key={m.id} className="p-6 bg-white rounded-3xl border border-slate-200 flex flex-col justify-between group hover:shadow-xl hover:border-teal-200 transition-all">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-300 text-xs shadow-inner group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                        #{idx + 1}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditModule(m)} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => {
                            if(confirm('Permanently remove this training module?')) {
                              const updated = modules.filter(mod => mod.id !== m.id);
                              setModules(updated);
                              db.setModules(updated);
                            }
                        }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-teal-600 transition-colors">{m.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      {m.attachments.length} {m.attachments.length === 1 ? 'Asset' : 'Assets'}
                    </span>
                    <button onClick={() => handleEditModule(m)} className="text-[10px] font-black text-teal-600 flex items-center gap-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                      Edit Content <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-8 pb-12">
           <div><h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Portal Architecture</h2><p className="text-slate-500">Customize visual assets and corporate identity.</p></div>
           <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm space-y-10">
             <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 Dashboard Hero Banner
                 <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                 1200x400 Recommended
               </label>
               <div className="aspect-[3/1] w-full rounded-3xl overflow-hidden border-4 border-slate-50 relative group shadow-inner">
                 <img src={settings.heroImageUrl} className="w-full h-full object-cover" alt="Hero" />
                 <label className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
                    <div className="bg-white px-5 py-2.5 rounded-xl font-bold text-slate-900 flex items-center gap-2 shadow-2xl transform scale-90 group-hover:scale-100 transition-transform text-xs">
                      <Upload className="w-4 h-4" /> Change Background
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero')} />
                 </label>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Identity (Logo)</label>
                 <div className="h-28 w-full bg-slate-50 rounded-2xl flex items-center justify-center p-6 border border-slate-100 group relative shadow-inner">
                   <img src={settings.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo" />
                   <label className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      <div className="flex flex-col items-center text-teal-600 gap-1">
                        <Upload className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Upload Logo</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                   </label>
                 </div>
               </div>
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Entity Name</label>
                 <div className="space-y-4">
                   <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 shadow-sm focus:border-teal-500 transition-all outline-none" value={settings.companyName} onChange={e => { const s = { ...settings, companyName: e.target.value }; setSettings(s); db.setSettings(s); }} />
                   <div className="flex items-center gap-2 text-teal-600 text-[9px] font-black uppercase tracking-widest px-1">
                     <Save className="w-3 h-3" /> Auto-saved to local storage
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      )}
    </Layout>
  );
}
