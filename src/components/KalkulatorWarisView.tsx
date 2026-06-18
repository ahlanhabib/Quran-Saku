import { PageContainer } from "./PageContainer";
import React, { useState } from "react";
import { ArrowLeft, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  onBack: () => void;
  addToast: (t: string, m: string, type: "success"|"warning"|"info") => void;
}

interface WarisResult {
  role: string;
  count: number;
  share: number;
  amount: number;
}

export const KalkulatorWarisView: React.FC<Props> = ({ onBack, addToast }) => {
  const [harta, setHarta] = useState<string>("");
  const [gender, setGender] = useState<"l"|"p">("l");
  const [hasAyah, setHasAyah] = useState(true);
  const [hasIbu, setHasIbu] = useState(true);
  const [hasPasangan, setHasPasangan] = useState(true);
  const [jmlAnakLaki, setJmlAnakLaki] = useState(0);
  const [jmlAnakPr, setJmlAnakPr] = useState(0);

  const [results, setResults] = useState<WarisResult[] | null>(null);

  const hitungWaris = () => {
    const total = parseFloat(harta);
    if (!harta || isNaN(total) || total <= 0) {
      addToast("Input Tidak Valid", "Masukkan total harta waris yang valid.", "warning");
      return;
    }

    const hasAnak = jmlAnakLaki > 0 || jmlAnakPr > 0;
    
    let sIbu = 0;
    let sPasangan = 0;
    let sAyah = 0;
    let sAnakPr = 0;
    let sAnakLaki = 0;

    if (hasIbu) sIbu = hasAnak ? 1/6 : 1/3;
    if (hasPasangan) {
      if (gender === "l") sPasangan = hasAnak ? 1/8 : 1/4; // isteri
      else sPasangan = hasAnak ? 1/4 : 1/2; // suami
    }

    let asabah = 1 - sIbu - sPasangan;

    if (hasAyah) {
      if (jmlAnakLaki > 0 || jmlAnakPr > 0) {
        sAyah = 1/6;
        asabah -= 1/6;
      } else {
        sAyah = asabah;
        asabah = 0;
      }
    }

    if (jmlAnakLaki === 0 && jmlAnakPr > 0) {
      sAnakPr = jmlAnakPr === 1 ? 1/2 : 2/3;
      asabah -= sAnakPr;

      if (hasAyah && asabah > 0) {
        sAyah += asabah;
        asabah = 0;
      }
    }

    if (jmlAnakLaki > 0) {
      const parts = (jmlAnakLaki * 2) + jmlAnakPr;
      if (asabah > 0) {
        sAnakLaki = asabah * ( (jmlAnakLaki * 2) / parts );
        sAnakPr = asabah * ( jmlAnakPr / parts );
      }
    }

    // Aul / Rad correction (Simplified)
    const totalAssigned = Math.max(0.0001, sIbu + sPasangan + sAyah + sAnakPr + sAnakLaki);
    sIbu /= totalAssigned;
    sPasangan /= totalAssigned;
    sAyah /= totalAssigned;
    sAnakPr /= totalAssigned;
    sAnakLaki /= totalAssigned;

    const res: WarisResult[] = [];
    if (hasPasangan) res.push({ role: gender === "l" ? "Istri" : "Suami", count: 1, share: sPasangan, amount: sPasangan * total });
    if (hasAyah) res.push({ role: "Ayah", count: 1, share: sAyah, amount: sAyah * total });
    if (hasIbu) res.push({ role: "Ibu", count: 1, share: sIbu, amount: sIbu * total });
    if (jmlAnakLaki > 0) res.push({ role: "Anak Laki-Laki", count: jmlAnakLaki, share: sAnakLaki, amount: sAnakLaki * total });
    if (jmlAnakPr > 0) res.push({ role: "Anak Perempuan", count: jmlAnakPr, share: sAnakPr, amount: sAnakPr * total });

    setResults(res.filter(r => r.amount > 0));
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
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
            Kalkulator Waris
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            Ilmu Faraidh
          </p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 space-y-4 pb-6">
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex items-start gap-3">
          <Calculator className="w-5 h-5 text-sky-600 mt-0.5 min-w-[20px]" />
          <p className="text-xs text-sky-800 leading-relaxed font-medium">
            Kalkulator ini memudahkan perhitungan (simulasi) pembagian harta waris bagi ahli waris utama berdasarkan syariat Islam.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Harta Waris Bersih</label>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
               <input 
                 type="number"
                 value={harta}
                 onChange={e => setHarta(e.target.value)}
                 placeholder="Misal 150000000"
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0F4C3A] font-mono"
               />
             </div>
           </div>

           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pewaris (Yang Wafat)</label>
             <div className="flex gap-3">
               <button onClick={() => setGender("l")} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${gender === "l" ? "bg-[#0F4C3A] text-white border-[#0F4C3A]" : "bg-white text-slate-600 border-slate-200"}`}>Laki-Laki</button>
               <button onClick={() => setGender("p")} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${gender === "p" ? "bg-[#0F4C3A] text-white border-[#0F4C3A]" : "bg-white text-slate-600 border-slate-200"}`}>Perempuan</button>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer border border-slate-100">
               <input type="checkbox" checked={hasAyah} onChange={e => setHasAyah(e.target.checked)} className="w-5 h-5 accent-[#0F4C3A] cursor-pointer" />
               <span className="text-sm font-bold text-slate-700">Ayah Hidup</span>
             </label>
             <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer border border-slate-100">
               <input type="checkbox" checked={hasIbu} onChange={e => setHasIbu(e.target.checked)} className="w-5 h-5 accent-[#0F4C3A] cursor-pointer" />
               <span className="text-sm font-bold text-slate-700">Ibu Hidup</span>
             </label>
             <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer border border-slate-100 col-span-2">
               <input type="checkbox" checked={hasPasangan} onChange={e => setHasPasangan(e.target.checked)} className="w-5 h-5 accent-[#0F4C3A] cursor-pointer" />
               <span className="text-sm font-bold text-slate-700">{gender === "l" ? "Istri" : "Suami"} Hidup</span>
             </label>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-2">Jumlah Anak Laki-laki</label>
               <input type="number" min={0} value={jmlAnakLaki} onChange={e => setJmlAnakLaki(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-2">Jumlah Anak Perempuan</label>
               <input type="number" min={0} value={jmlAnakPr} onChange={e => setJmlAnakPr(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
             </div>
           </div>

           <button 
             onClick={hitungWaris}
             className="w-full py-4 rounded-xl bg-[#0F4C3A] hover:bg-[#0F4C3A]/90 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
           >
             Hitung Pembagian Waris
           </button>
        </div>

        {results && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 mt-4">
               <h4 className="font-bold text-emerald-800 text-base mb-4">Hasil Simulasi Faraidh</h4>
               <div className="space-y-3">
                 {results.map((res, i) => (
                   <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 last:pb-0">
                     <div>
                       <p className="font-bold text-slate-800 text-sm">{res.role} {res.count > 1 ? `(${res.count} orang)` : ""}</p>
                       <p className="text-xs text-slate-500 font-medium">Porsi: {(res.share * 100).toFixed(2)}%</p>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-emerald-700 font-mono text-sm">{formatRupiah(res.amount)}</p>
                       {res.count > 1 && (
                         <p className="text-[10px] text-slate-400 font-medium mt-0.5">{formatRupiah(res.amount / res.count)} / orang</p>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageContainer>
  );
};
