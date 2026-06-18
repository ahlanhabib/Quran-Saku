/**
 * @author Habib Ismail Al Qadri
 * @app Quran Saku
 */
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash,
  ArrowRight,
  HelpCircle,
  BookOpen,
  ChevronRight,
  MessageSquareCode,
  Search,
  Terminal,
} from "lucide-react";
import { STATIC_SURAHS } from "../data";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface CariViewProps {
  onSelectSurah: (surahNo: number) => void;
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
  geminiApiKey?: string;
}

export const CariView: React.FC<CariViewProps> = ({
  onSelectSurah,
  addToast,
}) => {
  // Global search states
  const [globalQuery, setGlobalQuery] = useState("");
  const [matchedSurahs, setMatchedSurahs] = useState<typeof STATIC_SURAHS>([]);

  // Global search filtering on input change
  useEffect(() => {
    if (!globalQuery.trim()) {
      setMatchedSurahs([]);
      return;
    }
    const matches = STATIC_SURAHS.filter(
      (s) =>
        s.namaLatin.toLowerCase().includes(globalQuery.toLowerCase()) ||
        s.arti.toLowerCase().includes(globalQuery.toLowerCase()) ||
        s.deskripsi.toLowerCase().includes(globalQuery.toLowerCase()),
    );
    setMatchedSurahs(matches);
  }, [globalQuery]);

  return (
    <div className="flex flex-col h-full bg-[#FDFBF7] relative max-w-2xl mx-auto w-full pb-32 sm:pb-36">
      <div className="p-5 flex flex-col gap-5">
        
        <div className="bg-gradient-to-br from-[#0F4C3A] to-emerald-900 border border-emerald-800 p-6 rounded-[28px] relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <BookOpen className="w-10 h-10 text-[#ECC17A] mb-4 relative z-10 opacity-90" />
          <h4 className="font-serif font-bold text-[#ECC17A] text-xl relative z-10">
            Pencarian Al-Qur'an
          </h4>
          <p className="text-xs text-emerald-100/80 font-medium mt-1.5 relative z-10 leading-relaxed max-w-[90%]">
            Cari surah berdasarkan lafadz, nama, atau terjemahan maknanya.
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Cari lafadz atau arti (cth: sapi, gua, pembukaan)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[20px] pl-12 pr-4 py-4 text-sm text-slate-700 focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A] transition-all shadow-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
          </div>

          {/* Results array */}
          <div className="flex flex-col gap-3 mt-2 min-h-[400px]">
            {globalQuery.trim() ? (
              matchedSurahs.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hasil Pencarian ({matchedSurahs.length})
                  </h4>
                  {matchedSurahs.map((surah) => (
                    <button
                      key={surah.nomor}
                      onClick={() => {
                        onSelectSurah(surah.nomor);
                        addToast(
                          "Membuka Surah",
                          `Membuka halaman Surat ${surah.namaLatin}`,
                          "success",
                        );
                      }}
                      className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-white hover:bg-emerald-50/70 hover:border-emerald-200 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-emerald-100/60 font-serif font-bold text-sm text-emerald-800 flex items-center justify-center shrink-0">
                          {surah.nomor}
                        </span>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800 text-sm group-hover:text-[#0F4C3A] transition-colors truncate block">
                            {surah.namaLatin}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                            {surah.arti} • {surah.jumlahAyat} Ayah
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-sm font-semibold flex flex-col items-center gap-3">
                  <BookOpen className="w-10 h-10 text-slate-200 stroke-[1.5]" />
                  Tidak ada kecocokan arti kata kunci "{globalQuery}"
                </div>
              )
            ) : (
              <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100/80 rounded-[24px] p-6 flex flex-col items-center justify-center">
                <Search className="w-10 h-10 mx-auto text-slate-200 mb-4 stroke-[1.5]" />
                <p className="text-sm font-medium max-w-[200px]">
                  Tuliskan kata kunci untuk memicu indeks pencari pintar surah.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
