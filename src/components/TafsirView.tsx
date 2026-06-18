import { PageContainer } from "./PageContainer";
import { LoaderLogo } from "./LoaderLogo";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Search,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface SubSurah {
  nomor: number;
  namaLatin: string;
  arti: string;
  jumlahAyat: number;
}

interface KemenagTafsirDetail {
  nomor: number;
  namaLatin: string;
  tafsir: string;
}

interface TafsirViewProps {
  onBack?: () => void;
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
}

export const TafsirView: React.FC<TafsirViewProps> = ({ onBack, addToast }) => {
  const [surahs, setSurahs] = useState<SubSurah[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSurahData, setSelectedSurahData] =
    useState<KemenagTafsirDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchSurahs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("https://equran.id/api/v2/surat");
        if (!response.ok) throw new Error();
        const res = await response.json();

        if (res.code === 200 && res.data) {
          setSurahs(
            res.data.map((s: any) => ({
              nomor: s.nomor,
              namaLatin: s.namaLatin,
              arti: s.arti,
              jumlahAyat: s.jumlahAyat,
            })),
          );
        } else {
          throw new Error();
        }
      } catch (e) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurahs();
  }, []);

  const handleSelectSurah = async (nomor: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://equran.id/api/v2/tafsir/${nomor}`);
      if (!response.ok) throw new Error();
      const res = await response.json();

      if (res.code === 200 && res.data) {
        setSelectedSurahData({
          nomor: res.data.nomor,
          namaLatin: res.data.namaLatin,
          tafsir: res.data.tafsir
            .map((t: any) => `**Ayat ${t.ayat}**: \n\n${t.teks}`)
            .join("\n\n---\n\n"), // this is equran format
        });

        // Wait equran actually provides per-ayat:
        // `teks` contains the tafsir text for that ayah.
      } else {
        throw new Error();
      }
    } catch {
      addToast(
        "Gagal Memuat Tafsir",
        "Periksa koneksi internet Anda.",
        "warning",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeDataList = surahs.filter((s) =>
    s.namaLatin.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (selectedSurahData) {
    return (
      <PageContainer>
        <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => setSelectedSurahData(null)}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
          </button>
          <div>
            <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">
              Tafsir Surah {selectedSurahData.namaLatin}
            </h3>
            <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
              Tafsir Tahlili Kemenag RI
            </p>
          </div>
        </div>

        <div className="p-6 prose prose-slate prose-sm max-w-none pb-8 prose-p:leading-relaxed prose-p:text-slate-700">
          {selectedSurahData.tafsir.split("\n\n---\n\n").map((block, idx) => {
            const parts = block.split("**Ayat ");
            if (parts.length < 2) return null;
            const contentParts = parts[1].split("**: \n\n");
            if (contentParts.length < 2) return null;
            const ayatNo = contentParts[0];
            const textContent = contentParts[1];

            return (
              <div
                key={idx}
                className="mb-8 bg-slate-50 border border-slate-100 p-5 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {ayatNo}
                  </span>
                  <span className="text-sm font-bold text-emerald-900 border-b-2 border-emerald-200">
                    Tafsir Ayat {ayatNo}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {textContent}
                </p>
              </div>
            );
          })}
        </div>
      </PageContainer>
    );
  }

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
            Tafsir Al-Qur'an
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            KEMENAG RI
          </p>
        </div>
      </div>

      <div className="flex flex-col py-8 px-4 sm:px-6 w-full max-w-2xl mx-auto h-full">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-emerald-700/50" />
          </div>
          <input
            type="text"
            placeholder="Cari Surah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-emerald-100/60 rounded-2xl text-sm font-semibold text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-emerald-800/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {isLoading ? (
            <LoaderLogo />
          ) : isError ? (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
              <h4 className="font-bold text-red-800">Koneksi Terputus</h4>
              <p className="text-xs text-red-600/80 mt-1">
                Gagal menghubungi server penyedia tafsir.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeDataList.map((surah) => (
                <button
                  key={surah.nomor}
                  onClick={() => handleSelectSurah(surah.nomor)}
                  className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-200 hover:shadow-sm transition-all focus:outline-none text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-colors">
                      {surah.nomor}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-[#0F4C3A] transition-colors">
                        {surah.namaLatin}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {surah.arti} • {surah.jumlahAyat} Ayat
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-[#0F4C3A] group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                </button>
              ))}

              {activeDataList.length === 0 && (
                <div className="text-center py-10 opacity-60">
                  <p className="text-sm font-semibold text-slate-600">
                    Surah tidak ditemukan.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
