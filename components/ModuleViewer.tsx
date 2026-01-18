
import React from 'react';
import { Module, UserProgress, Attachment } from '../types.ts';
import { Lock, CheckCircle, FileText, PlayCircle, Eye, ChevronLeft, ChevronRight, Image as ImageIcon, Music, Download, Presentation, Files, Loader2, ExternalLink } from 'lucide-react';

interface ModuleViewerProps {
  modules: Module[];
  progress: UserProgress[];
  onComplete: (moduleId: string) => void;
}

export default function ModuleViewer({ modules, progress, onComplete }: ModuleViewerProps) {
  const [selectedModule, setSelectedModule] = React.useState<Module | null>(null);
  const [activeAttachment, setActiveAttachment] = React.useState<Attachment | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = React.useState<string | null>(null);

  // Helper to convert data URI to Blob URL for more reliable rendering
  const dataURIToBlobURL = (dataURI: string) => {
    try {
      const parts = dataURI.split(',');
      if (parts.length < 2) return dataURI;
      
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Failed to convert data URI to blob", e);
      return dataURI;
    }
  };

  // Clean up Blob URLs to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Handle attachment changes and generate Blob URL
  React.useEffect(() => {
    const attachment = activeAttachment || (selectedModule?.attachments[0] || null);
    
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    if (attachment && attachment.type.includes('pdf')) {
      if (attachment.url.startsWith('data:')) {
        const url = dataURIToBlobURL(attachment.url);
        setPdfBlobUrl(url);
      } else {
        setPdfBlobUrl(attachment.url);
      }
    }
  }, [activeAttachment, selectedModule]);

  const openInNewTab = (url: string) => {
    const win = window.open(url, '_blank');
    if (win) win.focus();
  };

  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevModule = modules.find(m => m.orderIndex === index - 1);
    if (!prevModule) return true;
    const prevProgress = progress.find(p => p.moduleId === prevModule.id);
    return prevProgress?.isCompleted || false;
  };

  const isCompleted = (moduleId: string) => {
    return progress.find(p => p.moduleId === moduleId)?.isCompleted || false;
  };

  const renderFilePreview = (attachment: Attachment) => {
    const type = attachment.type.toLowerCase();
    const isBase64 = attachment.url.startsWith('data:');
    
    // PDF Handling
    if (type.includes('pdf')) {
      const source = pdfBlobUrl;
      
      if (!source) {
        return (
          <div className="flex flex-col items-center justify-center h-[750px] bg-slate-900 text-white">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-4" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Initializing Secure PDF Viewer...</p>
          </div>
        );
      }

      return (
        <div className="w-full h-[750px] bg-slate-800 relative flex flex-col">
          <div className="flex-1 relative">
            <iframe 
              key={source} // Key forces re-render on attachment change
              src={`${source}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full border-none shadow-2xl bg-slate-700"
              title={attachment.title}
            />
            
            {/* Overlay button for cases where iframe is blocked or user wants full screen */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 opacity-0 hover:opacity-100 transition-opacity pointer-events-none hover:pointer-events-auto backdrop-blur-[2px]">
               <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-4 max-w-xs transform scale-95 hover:scale-100 transition-transform">
                  <ExternalLink className="w-12 h-12 text-teal-600 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-900">Better Viewing?</h4>
                    <p className="text-xs text-slate-500 mt-1">Open this document in a new browser tab for full fidelity.</p>
                  </div>
                  <button 
                    onClick={() => openInNewTab(source)}
                    className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/20"
                  >
                    Launch External Viewer
                  </button>
               </div>
            </div>
          </div>
          
          <div className="p-3 bg-slate-900 border-t border-slate-700 flex items-center justify-between">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">In-Portal Protected View</p>
             <button 
               onClick={() => openInNewTab(source)}
               className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
             >
               <ExternalLink className="w-3 h-3" /> Pop-out Viewer
             </button>
          </div>
        </div>
      );
    } 
    
    // Presentation / Powerpoint Handling
    const isPPT = type.includes('presentation') || type.includes('powerpoint') || attachment.title.toLowerCase().endsWith('.pptx') || attachment.title.toLowerCase().endsWith('.ppt');
    if (isPPT) {
      if (!isBase64) {
        const encodedUrl = encodeURIComponent(attachment.url);
        return (
          <iframe 
            src={`https://docs.google.com/gview?url=${encodedUrl}&embedded=true`}
            className="w-full h-[750px] border-none bg-white"
            title={attachment.title}
          />
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center p-24 bg-slate-900 text-white gap-6 text-center h-[750px]">
            <Presentation className="w-24 h-24 text-teal-400 opacity-80" />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Presentation Loaded</h3>
              <p className="text-slate-400 max-w-md mx-auto">This PowerPoint is ready for your review. Due to security restrictions on local files, please use the button below to open it.</p>
            </div>
            {attachment.canDownload && (
              <a 
                href={attachment.url} 
                download={attachment.title}
                className="px-8 py-4 bg-teal-600 hover:bg-teal-500 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <Download className="w-5 h-5" /> Open Presentation
              </a>
            )}
          </div>
        );
      }
    }

    // Video Handling
    if (type.includes('video')) {
      return (
        <div className="bg-black flex items-center justify-center h-[750px]">
          <video controls className="w-full max-h-full" controlsList={attachment.canDownload ? "" : "nodownload"}>
            <source src={attachment.url} type={attachment.type} />
          </video>
        </div>
      );
    }

    // Image Handling
    if (type.includes('image')) {
      return (
        <div className="flex items-center justify-center bg-slate-100 p-8 h-[750px]">
          <img src={attachment.url} alt={attachment.title} className="max-w-full max-h-full shadow-2xl rounded-lg border border-slate-200 object-contain" />
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-slate-50 gap-6 text-center h-[750px]">
        <FileText className="w-20 h-20 text-slate-300" />
        <div>
          <h3 className="text-xl font-bold text-slate-800">{attachment.title}</h3>
          <p className="text-slate-500 mt-2">Document Preview Ready</p>
        </div>
        {attachment.canDownload && (
          <a href={attachment.url} download={attachment.title} className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl">
            <Download className="w-5 h-5" /> Download Resource
          </a>
        )}
      </div>
    );
  };

  const getIcon = (mimeType: string, title: string) => {
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (type.includes('image')) return <ImageIcon className="w-5 h-5" />;
    if (type.includes('video')) return <PlayCircle className="w-5 h-5" />;
    if (type.includes('audio')) return <Music className="w-5 h-5" />;
    if (type.includes('presentation') || type.includes('powerpoint') || title.toLowerCase().endsWith('.pptx')) return <Presentation className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  if (selectedModule) {
    const currentAttachment = activeAttachment || selectedModule.attachments[0];
    
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-20">
        <button 
          onClick={() => { setSelectedModule(null); setActiveAttachment(null); }}
          className="flex items-center text-slate-500 font-semibold hover:text-teal-600 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Curriculum
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar - Attachment Navigator */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Files className="w-3.5 h-3.5" /> Module Resources
              </h4>
              <div className="space-y-2">
                {selectedModule.attachments.map((att) => (
                  <button
                    key={att.id}
                    onClick={() => setActiveAttachment(att)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all border ${
                      currentAttachment?.id === att.id
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-teal-200 hover:bg-teal-50/30'
                    }`}
                  >
                    <div className={`mr-3 ${currentAttachment?.id === att.id ? 'text-white' : 'text-teal-500'}`}>
                      {getIcon(att.type, att.title)}
                    </div>
                    <span className="text-xs font-bold truncate text-left flex-1">{att.title}</span>
                    {currentAttachment?.id === att.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                   {isCompleted(selectedModule.id) ? (
                     <span className="text-[10px] font-black text-teal-600 uppercase">Completed ✓</span>
                   ) : (
                     <span className="text-[10px] font-black text-amber-500 uppercase">In Progress</span>
                   )}
                </div>
                {!isCompleted(selectedModule.id) && (
                   <button
                     onClick={() => onComplete(selectedModule.id)}
                     className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all active:scale-95 text-xs"
                   >
                     Complete Module
                   </button>
                )}
              </div>
            </div>

            {currentAttachment?.canDownload && (
              <a 
                href={currentAttachment.url} 
                download={currentAttachment.title}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl text-xs"
              >
                <Download className="w-4 h-4" /> Download Current File
              </a>
            )}
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3">
             <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{currentAttachment?.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedModule.title} • {currentAttachment?.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                  </div>
                  <div className="flex gap-2">
                    {currentAttachment?.type.includes('pdf') && (
                      <button 
                        onClick={() => pdfBlobUrl && openInNewTab(pdfBlobUrl)}
                        className="text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-200 uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-3 h-3" /> Fullscreen
                      </button>
                    )}
                    {currentAttachment?.canDownload ? (
                      <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded border border-teal-100 uppercase tracking-widest">Download Permitted</span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 uppercase tracking-widest">View Only</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-900 min-h-[600px]">
                   {currentAttachment && renderFilePreview(currentAttachment)}
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
      {modules.sort((a, b) => a.orderIndex - b.orderIndex).map((module, idx) => {
        const unlocked = isUnlocked(module.orderIndex);
        const completed = isCompleted(module.id);

        return (
          <div 
            key={module.id}
            className={`group relative rounded-3xl border-2 transition-all duration-500 ${
              unlocked 
                ? 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-2xl cursor-pointer' 
                : 'bg-slate-100/50 border-slate-200 opacity-70 grayscale cursor-not-allowed'
            }`}
            onClick={() => unlocked && setSelectedModule(module)}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl shadow-sm transition-colors ${unlocked ? 'bg-teal-50 text-teal-600' : 'bg-slate-200 text-slate-500'}`}>
                   <Files className="w-6 h-6" />
                </div>
                {completed ? (
                  <div className="flex items-center gap-1.5 bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                    <CheckCircle className="w-3.5 h-3.5" /> Done
                  </div>
                ) : !unlocked && (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module 0{idx + 1}</span>
                   <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors">{module.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{module.description}</p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                  {module.attachments.length} {module.attachments.length === 1 ? 'Resource' : 'Resources'}
                </span>
                {unlocked && (
                   <div className="flex items-center text-teal-600 text-xs font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                     Launch <ChevronRight className="w-4 h-4 ml-1" />
                   </div>
                )}
              </div>
            </div>
            {!unlocked && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 backdrop-blur-[2px] rounded-3xl">
                 <div className="bg-white/95 px-5 py-2.5 rounded-full shadow-lg text-xs font-bold text-slate-700 border border-slate-200 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> Complete Module {idx} to unlock
                 </div>
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
