import { PageContainer } from "./PageContainer";
import React, { useState } from "react";
import { ArrowLeft, Play, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  onBack: () => void;
  addToast: (title: string, msg: string, type: "success" | "warning" | "info") => void;
}

const asmaulHusnaData = [
  { id: 1, arab: "الرَّحْمَنُ", latin: "Ar-Rahman", arti: "Yang Maha Pengasih" },
  { id: 2, arab: "الرَّحِيمُ", latin: "Ar-Rahim", arti: "Yang Maha Penyayang" },
  { id: 3, arab: "الْمَلِكُ", latin: "Al-Malik", arti: "Yang Maha Merajai" },
  { id: 4, arab: "الْقُدُّوسُ", latin: "Al-Quddus", arti: "Yang Maha Suci" },
  { id: 5, arab: "السَّلَامُ", latin: "As-Salam", arti: "Yang Maha Memberi Kesejahteraan" },
  { id: 6, arab: "الْمُؤْمِنُ", latin: "Al-Mu'min", arti: "Yang Maha Memberi Keamanan" },
  { id: 7, arab: "الْمُهَيْمِنُ", latin: "Al-Muhaimin", arti: "Yang Maha Pemelihara" },
  { id: 8, arab: "الْعَزِيزُ", latin: "Al-Aziz", arti: "Yang Maha Perkasa" },
  { id: 9, arab: "الْجَبَّارُ", latin: "Al-Jabbar", arti: "Yang Maha Memaksa" },
  { id: 10, arab: "الْمُتَكَبِّرُ", latin: "Al-Mutakabbir", arti: "Yang Maha Memiliki Kebesaran" },
  // Truncated for simplicity, but simulating a rich list
  { id: 11, arab: "الْخَالِقُ", latin: "Al-Khaliq", arti: "Yang Maha Pencipta" },
  { id: 12, arab: "الْبَارِئُ", latin: "Al-Bari'", arti: "Yang Maha Melepaskan" },
  { id: 98, arab: "الرَّشِيدُ", latin: "Ar-Rashid", arti: "Yang Maha Pandai" },
  { id: 99, arab: "الصَّبُورُ", latin: "As-Sabur", arti: "Yang Maha Sabar" },
];

export const AsmaulHusnaView: React.FC<Props> = ({ onBack, addToast }) => {
  const [activeFlipped, setActiveFlipped] = useState<number | null>(null);

  const handleFlip = (id: number) => {
    setActiveFlipped(activeFlipped === id ? null : id);
  };

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
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">
            Asmaul Husna
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            99 Nama Allah
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col px-4 py-8 space-y-4">
        
        <div className="bg-gradient-to-r from-[#0F4C3A] to-emerald-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg mb-6">
           <svg className="absolute top-0 right-0 w-32 h-32 opacity-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
           </svg>
           <h3 className="font-serif font-bold text-2xl mb-1">Hafalan Asmaul Husna</h3>
           <p className="text-emerald-100/90 text-sm font-medium leading-relaxed max-w-[85%]">
             Barangsiapa menghafalnya, niscaya ia masuk surga. (HR. Bukhari & Muslim)
           </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-6">
          {asmaulHusnaData.map((item) => (
             <div 
               key={item.id} 
               className="relative h-40 [perspective:1000px] cursor-pointer"
               onClick={() => handleFlip(item.id)}
             >
               <motion.div
                 className="w-full h-full relative"
                 initial={false}
                 animate={{ rotateY: activeFlipped === item.id ? 180 : 0 }}
                 transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                 style={{ transformStyle: "preserve-3d" }}
               >
                 {/* Arab Face (Front) */}
                 <div className="absolute inset-0 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center p-4 [backface-visibility:hidden]">
                    <span className="absolute top-3 left-3 text-xs font-bold text-slate-300 font-mono">{item.id}</span>
                    <h4 className="font-serif text-3xl font-bold text-[#0F4C3A] text-center shrink-0">{item.arab}</h4>
                 </div>

                 {/* Latin & Arti Face (Back) */}
                 <div 
                   className="absolute inset-0 bg-[#0F4C3A] text-white rounded-2xl border border-emerald-900 shadow-md flex flex-col items-center justify-center p-4 [backface-visibility:hidden]"
                   style={{ transform: "rotateY(180deg)" }}
                 >
                    <h5 className="font-bold text-base text-center text-emerald-100 mb-1">{item.latin}</h5>
                    <p className="text-xs text-center font-medium leading-relaxed">{item.arti}</p>
                 </div>
               </motion.div>
             </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
