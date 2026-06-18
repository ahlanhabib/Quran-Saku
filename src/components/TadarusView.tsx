import { PageContainer } from "./PageContainer";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, BookOpen, Plus, Calendar as CalendarIcon, CheckCircle2, X } from "lucide-react";
import { createPortal } from "react-dom";

interface TadarusViewProps {
  onBack: () => void;
  addToast: (title: string, message: string, type: "success" | "warning" | "info" | "notification") => void;
}

interface TadarusEntry {
  id: string;
  date: string;
  surahOrJuz: string;
  notes: string;
  timestamp: number;
}

export const TadarusView: React.FC<TadarusViewProps> = ({ onBack, addToast }) => {
  const [history, setHistory] = useState<TadarusEntry[]>(() => {
    const cached = localStorage.getItem("qs_tadarus_history");
    return cached ? JSON.parse(cached) : [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [surahOrJuz, setSurahOrJuz] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    localStorage.setItem("qs_tadarus_history", JSON.stringify(history));
  }, [history]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surahOrJuz.trim()) return;
    
    const newEntry: TadarusEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      surahOrJuz: surahOrJuz.trim(),
      notes: notes.trim(),
      timestamp: Date.now()
    };

    setHistory([newEntry, ...history]);
    setShowAddModal(false);
    setSurahOrJuz("");
    setNotes("");
    addToast("Tadarus Dicatat", "Riwayat bacaan berhasil disimpan.", "success");
  };

  const deleteEntry = (id: string) => {
    setHistory(history.filter(h => h.id !== id));
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-serif font-bold text-lg text-[#0F4C3A]">Jurnal Tadarus</h2>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#0F4C3A] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#0a3629] transition">
          <Plus className="w-4 h-4" /> Catat
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 opacity-60">
            <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium text-lg">Belum ada riwayat tadarus</p>
            <p className="text-slate-400 text-sm mt-1">Mulai catat bacaan harian Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative group"
                >
                  <button onClick={() => deleteEntry(item.id)} className="absolute top-4 right-4 p-1 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-2">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="font-serif text-[#0F4C3A] font-bold text-lg mb-1">{item.surahOrJuz}</h3>
                  {item.notes && <p className="text-slate-600 text-sm mt-2 pt-2 border-t border-slate-50">{item.notes}</p>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {showAddModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom,20px)] sm:p-6" style={{ height: "100dvh" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl relative max-h-[85dvh] overflow-hidden mb-4 sm:mb-0">
            <div className="p-5 sm:p-6 border-b border-slate-100 shrink-0">
              <button type="button" onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif font-bold text-xl text-[#0F4C3A] mb-1">Catat Tadarus</h3>
              <p className="text-sm text-slate-500">Rekam progres bacaan Al-Qur'an hari ini.</p>
            </div>
            
            <form onSubmit={handleAdd} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Surah / Juz yang dibaca</label>
                  <input 
                    type="text" 
                    value={surahOrJuz}
                    onChange={(e) => setSurahOrJuz(e.target.value)}
                    placeholder="Contoh: Juz 30 atau Al-Baqarah 1-10" 
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catatan (Opsional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tulis refleksi atau catatan kecil..." 
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[100px]"
                  ></textarea>
                </div>
              </div>
              
              <div className="p-5 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <button type="submit" disabled={!surahOrJuz.trim()} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  <CheckCircle2 className="w-5 h-5" /> Simpan Catatan
                </button>
              </div>
            </form>
          </motion.div>
        </div>, document.body
      )}
    </PageContainer>
  );
};
