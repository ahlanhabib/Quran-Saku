import { PageContainer } from "./PageContainer";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BookOpen, User, Quote, CheckCircle2, Sparkles, Loader2, X, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KhutbahBlock {
  type: "text" | "quran" | "hadith" | "points" | "doa";
  text?: string;
  arabic?: string;
  translation?: string;
  source?: string;
  intro?: string;
  items?: { title: string; desc: string }[];
}

interface Khutbah {
  id: number;
  title: string;
  author?: string;
  tema: string;
  ringkasan: string;
  muqaddimah: string;
  isi?: string; // Legacy
  content?: KhutbahBlock[];
  penutup: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string | Date;
  messages: any[];
}

interface Props {
  onBack: () => void;
}

export const KhutbahJumatView: React.FC<Props> = ({ onBack }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [khutbahData, setKhutbahData] = useState<Khutbah[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Generator state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTema, setAiTema] = useState("");
  const [aiJudul, setAiJudul] = useState("");
  const [aiContextMessages, setAiContextMessages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  
  // History from Tanya Ustadz
  const [tanyaUstadzHistory, setTanyaUstadzHistory] = useState<ChatSession[]>([]);

  useEffect(() => {
    const fetchKhutbah = async () => {
      try {
        const response = await fetch('/data/khutbah.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setKhutbahData(data);
      } catch (error) {
        console.error("Failed to fetch khutbah data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKhutbah();
  }, []);

  useEffect(() => {
    if (showAiModal) {
      try {
        const saved = localStorage.getItem("tanyaUstadzSessions");
        if (saved) {
          const parsed = JSON.parse(saved);
          setTanyaUstadzHistory(parsed.slice(0, 5)); // Get up to 5 recent sessions
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, [showAiModal]);

  const handleGenerateAI = async () => {
    if (!aiTema.trim()) return;
    setIsGenerating(true);
    setAiError("");

    try {
      // Need API Key context for generator if managed globally, but here we read from localEnv if available, or just send empty so server uses its own fallback or client passes it..
      const apiKey = localStorage.getItem("GEMINI_API_KEY") || "";
      
      let tanyaUstadzContextStr = "";
      if (aiContextMessages && aiContextMessages.length > 0) {
        tanyaUstadzContextStr = aiContextMessages.map(m => `${m.sender === 'user' ? 'Penanya' : 'Tanya Ustadz AI'}: ${m.text}`).join('\n\n');
      }

      const payload: any = { tema: aiTema, judul: aiJudul, apiKey, tanyaUstadzContext: tanyaUstadzContextStr };

      const response = await fetch("/api/generate-khutbah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(!response.ok ? `Error ${response.status}: Server sedang kendala. Coba lagi.` : "Respons server tidak valid.");
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat khutbah");
      }


      setKhutbahData([data, ...khutbahData]);
      setShowAiModal(false);
      setSelectedId(data.id);
      setAiTema("");
      setAiJudul("");
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeKhutbah = khutbahData.find(k => k.id === selectedId);

  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
        {onBack && (
          <button
            onClick={() => {
              if (selectedId) setSelectedId(null);
              else onBack();
            }}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
          </button>
        )}
        <div>
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">
             Khutbah Jumat
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
             {selectedId ? "Detail Materi" : "Koleksi Materi Mimbar"}
          </p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="flex items-center justify-center p-10">
              <span className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></span>
            </motion.div>
          ) : !selectedId ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <button
                onClick={() => setShowAiModal(true)}
                className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 flex items-center justify-between text-white shadow-md active:scale-[0.98] transition-all hover:shadow-lg group"
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-lg mb-0.5 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-100" /> Buat Khutbah dengan AI
                  </span>
                  <span className="text-emerald-100 text-sm font-medium">Bikin naskah khutbah baru sesuai tema Anda</span>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
              </button>

              <div className="h-px w-full bg-slate-200/60 my-2"></div>

              <div className="space-y-3">
                {khutbahData.map(khutbah => (
                  <button 
                    key={khutbah.id} 
                    onClick={() => setSelectedId(khutbah.id)}
                    className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-slate-300 transition-all active:scale-[0.98] shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold max-w-[80%] truncate inline-block">
                        {khutbah.tema}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 font-serif text-lg leading-tight">{khutbah.title}</h3>
                    {khutbah.author && (
                      <p className="text-xs text-slate-400 flex items-center gap-1"><User className="w-3 h-3" /> {khutbah.author}</p>
                    )}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mt-1">
                      {khutbah.ringkasan}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
             <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
                 <div className="text-center">
                   <h2 className="font-serif text-2xl font-bold text-slate-800 mb-3 leading-tight">{activeKhutbah?.title}</h2>
                   {activeKhutbah?.author && (
                     <p className="text-sm text-slate-500 font-medium mb-4 flex items-center justify-center gap-1.5 object-center">
                       <User className="w-4 h-4" /> {activeKhutbah.author}
                     </p>
                   )}
                   <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold inline-block max-w-full truncate">
                     {activeKhutbah?.tema}
                   </span>
                 </div>

                 <div className="space-y-6">
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-end gap-2"><span>Muqaddimah</span> <BookOpen className="w-4 h-4" /></h4>
                     <p className="text-right text-2xl font-amiri leading-loose text-[#0F4C3A] whitespace-pre-wrap" dir="rtl">
                       {activeKhutbah?.muqaddimah}
                     </p>
                   </div>
                   
                   <div className="space-y-6">
                     {activeKhutbah?.content ? (
                       activeKhutbah.content.map((block, idx) => {
                         if (block.type === 'text') {
                           return (
                             <p key={idx} className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-[15px]">
                               {block.text}
                             </p>
                           );
                         }
                         if (block.type === 'quran' || block.type === 'hadith') {
                           return (
                             <div key={idx} className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 my-6">
                               <p className="text-right text-2xl font-amiri leading-loose text-[#0F4C3A] mb-4" dir="rtl">
                                 {block.arabic}
                               </p>
                               <div className="text-left" dir="ltr">
                                 <p className="text-[14px] text-emerald-800/80 font-medium italic mb-2">
                                   "{block.translation}"
                                 </p>
                                 <span className="text-[11px] font-bold text-emerald-600/60 uppercase tracking-widest">
                                   — {block.source}
                                 </span>
                               </div>
                             </div>
                           );
                         }
                         if (block.type === 'points') {
                           return (
                             <div key={idx} className="my-6">
                               {block.intro && <p className="text-slate-700 font-bold mb-4">{block.intro}</p>}
                               <div className="space-y-4">
                                 {block.items?.map((item, idxx) => (
                                   <div key={idxx} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                     <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                     <div>
                                        <h5 className="font-bold text-slate-800 text-[15px] mb-1">{item.title}</h5>
                                        <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           );
                         }
                         if (block.type === 'doa') {
                           return (
                             <div key={idx} className="bg-slate-800 p-6 rounded-2xl shadow-inner text-white my-6">
                               <p className="font-medium leading-relaxed whitespace-pre-wrap text-[15px] text-slate-200">
                                 {block.text}
                               </p>
                             </div>
                           );
                         }
                         return null;
                       })
                     ) : (
                       <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-sm">
                         {activeKhutbah?.isi}
                       </p>
                     )}
                   </div>

                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-end gap-2"><span>Penutup Khutbah</span> <BookOpen className="w-4 h-4" /></h4>
                     <p className="text-right text-2xl font-amiri leading-loose text-[#0F4C3A] mb-3" dir="rtl">
                       وَالْعَصْرِ إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ
                     </p>
                     <div className="text-center mb-6">
                       <p className="text-[14px] text-emerald-800/80 font-medium italic mb-2">
                         “Demi masa. Sesungguhnya manusia benar-benar berada dalam kerugian, kecuali orang-orang yang beriman dan mengerjakan amal saleh, serta saling menasihati dalam kebenaran dan saling menasihati dalam kesabaran.”
                       </p>
                       <span className="text-[11px] font-bold text-emerald-600/60 uppercase tracking-widest">
                         QS. Al-‘Ashr: 1–3
                       </span>
                     </div>
                     <div className="space-y-4 text-right font-amiri leading-loose text-slate-700 font-bold text-xl" dir="rtl">
                       <p>
                         بَارَكَ اللهُ لِيْ وَلَكُمْ فِي الْقُرْآنِ الْعَظِيْمِ، وَنَفَعَنِيْ وَإِيَّاكُمْ بِمَا فِيْهِ مِنَ الْآيَاتِ وَالذِّكْرِ الْحَكِيْمِ، وَتَقَبَّلَ مِنِّيْ وَمِنْكُمْ تِلَاوَتَهُ، إِنَّهُ هُوَ السَّمِيْعُ الْعَلِيْمُ.
                       </p>
                       <p>
                         أَقُوْلُ قَوْلِيْ هٰذَا، وَأَسْتَغْفِرُ اللهَ الْعَظِيْمَ لِيْ وَلَكُمْ وَلِسَائِرِ الْمُسْلِمِيْنَ وَالْمُسْلِمَاتِ، فَاسْتَغْفِرُوْهُ، إِنَّهُ هُوَ الْغَفُوْرُ الرَّحِيْمُ.
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAiModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom,20px)] sm:p-6" style={{ height: "100dvh" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl relative max-h-[85dvh] overflow-hidden mb-4 sm:mb-0">
            <div className="p-4 sm:p-6 border-b border-slate-100 shrink-0">
              <button onClick={() => !isGenerating && setShowAiModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full" disabled={isGenerating}>
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-1">Buat Khutbah AI</h3>
              <p className="text-sm text-slate-500 pr-8">Masukkan tema spesifik untuk naskah khutbah baru. AI akan merakitkan khutbah lengkap dengan dalil Quran dan Hadis.</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tema Pokok (Wajib)</label>
                  <input 
                    type="text" 
                    value={aiTema} 
                    onChange={e => setAiTema(e.target.value)} 
                    disabled={isGenerating}
                    placeholder="misal: Sabar Menghadapi Ujian Pasca Lebaran"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
                  />
                  {tanyaUstadzHistory.length > 0 && !isGenerating && (
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                        <History className="w-3.5 h-3.5" /> DARI RIWAYAT TANYA USTADZ AI
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tanyaUstadzHistory.map(session => {
                          const isSelected = aiTema === session.title;
                          return (
                          <button
                            key={session.id}
                            onClick={() => {
                              setAiTema(session.title);
                              setAiContextMessages(session.messages || []);
                            }}
                            disabled={isGenerating}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left max-w-full truncate border ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                          >
                            {session.title}
                          </button>
                        )})}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Judul Khusus (Opsional)</label>
                  <input 
                    type="text" 
                    value={aiJudul} 
                    onChange={e => setAiJudul(e.target.value)} 
                    disabled={isGenerating}
                    placeholder="Biar AI yang tentukan"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                {aiError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 shrink-0 mt-2">
                    {aiError}
                  </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50/50">
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiTema.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sedang Menulis Khutbah...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Generate Khutbah
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>, document.body
      )}
    </PageContainer>
  );
};
