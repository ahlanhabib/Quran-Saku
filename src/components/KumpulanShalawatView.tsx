import React from "react";
import { PageContainer } from "./PageContainer";
import { ArrowLeft, Quote } from "lucide-react";
import { SHALAWAT_DATA } from "../data/shalawatData";

interface Props {
  onBack: () => void;
  addToast: (t: string, m: string, type: "success"|"warning"|"info") => void;
}

export const KumpulanShalawatView: React.FC<Props> = ({ onBack, addToast }) => {
  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
          </button>
        )}
        <div>
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">Shalawat Nabi</h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">Kumpulan Shalawat Pilihan</p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 space-y-4 pb-6">
         {SHALAWAT_DATA.map(shalawat => (
           <div key={shalawat.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                   {shalawat.name}
                 </h3>
                 <p className="text-[11px] text-slate-500 font-medium mt-1">{shalawat.desc}</p>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(shalawat.arab);
                     addToast("Disalin", "Teks shalawat disalin", "success");
                   }}
                   className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition"
                 >
                   <Quote className="w-4 h-4" />
                 </button>
               </div>
             </div>
             
             <p className="font-amiri text-2xl text-right leading-loose text-[#0F4C3A] mt-4 mb-5" dir="rtl">
               {shalawat.arab}
             </p>
             <p className="text-sm font-italic text-slate-600 mb-3">{shalawat.latin}</p>
             <p className="text-[13px] text-slate-500 leading-relaxed font-medium">{shalawat.arti}</p>
           </div>
         ))}
      </div>
    </PageContainer>
  );
};
