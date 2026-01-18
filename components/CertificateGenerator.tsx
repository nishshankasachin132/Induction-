
import React from 'react';
import { User, SiteSettings } from '../types.ts';
import { Award, Download, Loader2 } from 'lucide-react';

interface CertificateGeneratorProps {
  user: User;
  settings: SiteSettings;
}

export default function CertificateGenerator({ user, settings }: CertificateGeneratorProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    const { jsPDF } = (window as any).jspdf;
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Elegant Border
    doc.setDrawColor(20, 184, 166); // Teal-500
    doc.setLineWidth(5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    doc.setDrawColor(15, 23, 42); // Dark Slate
    doc.setLineWidth(0.5);
    doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

    // Corporate Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 55, { align: 'center' });

    // Decorative Line
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - 40, 62, pageWidth / 2 + 40, 62);

    // Certify Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(71, 85, 105);
    doc.text('This is to certify that', pageWidth / 2, 80, { align: 'center' });

    // Employee Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(38);
    doc.setTextColor(20, 184, 166); // Teal-500
    doc.text(user.fullName.toUpperCase(), pageWidth / 2, 100, { align: 'center' });

    // Completion Message
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(71, 85, 105);
    doc.text('Has successfully completed the Corporate Induction Program of', pageWidth / 2, 120, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.companyName, pageWidth / 2, 132, { align: 'center' });

    // Footer Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`Official Record ID: BP-LKA-${user.id.toUpperCase()}`, pageWidth / 2, 150, { align: 'center' });
    doc.text(`Issued on: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 158, { align: 'center' });

    // Authority Label (Centered)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('CHIEF EXECUTIVE OFFICER', pageWidth / 2, 185, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('Best Pacific Textiles Lanka (Pvt) Ltd', pageWidth / 2, 192, { align: 'center' });

    // Save
    doc.save(`${user.fullName.replace(/\s+/g, '_')}_Induction_Certificate.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 text-white shadow-2xl flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
      
      <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-inner border border-white/20">
        <Award className="w-12 h-12 text-teal-400" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-4xl font-black tracking-tight">Certification Earned!</h2>
        <p className="text-slate-400 max-w-sm mx-auto font-medium">
          You have officially completed all induction modules. Your professional journey starts here.
        </p>
      </div>

      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="w-full relative flex items-center justify-center gap-3 px-8 py-4 bg-teal-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-teal-500 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-teal-500/20"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Preparing PDF...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Download Certificate
          </>
        )}
      </button>

      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        Authorized by CEO • Best Pacific Lanka
      </p>
    </div>
  );
}
