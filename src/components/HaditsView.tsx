import { PageContainer } from "./PageContainer";
import { LoaderLogo } from "./LoaderLogo";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Book,
  Scroll,
  RefreshCw,
  AlertTriangle,
  BookOpenCheck,
} from "lucide-react";

interface HadithBook {
  id: string;
  name: string;
  available: number;
}

interface HadithDetail {
  number: number;
  arab: string;
  id: string;
}

interface HaditsViewProps {
  onBack?: () => void;
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
}

export const HaditsView: React.FC<HaditsViewProps> = ({ onBack, addToast }) => {
  const [books, setBooks] = useState<HadithBook[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  const [selectedBook, setSelectedBook] = useState<HadithBook | null>(null);
  const [hadiths, setHadiths] = useState<HadithDetail[]>([]);
  const [isLoadingHadiths, setIsLoadingHadiths] = useState(false);

  // We fetch a simple range (1-50) for simplicity in demo
  const RANGE = "1-50";

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("https://hadis-api-id.vercel.app/hadith");
        if (!res.ok) throw new Error("Server Hadits Pusat Sedang Gangguan");
        const payload = await res.json();

        if (Array.isArray(payload)) {
          setBooks(payload.map((i: any) => ({
            id: i.slug,
            name: i.name,
            available: i.total
          })));
        }
      } catch (err) {
        addToast("Gagal Memuat Kitab", "Periksa koneksi internet.", "warning");
      } finally {
        setIsLoadingBooks(false);
      }
    };
    fetchBooks();
  }, [addToast]);

  const handleSelectBook = async (book: HadithBook) => {
    setSelectedBook(book);
    setIsLoadingHadiths(true);
    setHadiths([]);

    try {
      const res = await fetch(
        `https://hadis-api-id.vercel.app/hadith/${book.id}?page=1&limit=50`,
      );
      if (!res.ok) throw new Error("Server Hadits Pusat Sedang Gangguan");
      const payload = await res.json();

      if (payload.items) {
        setHadiths(payload.items.map((i: any) => ({
          number: i.number,
          arab: i.arab,
          id: i.id
        })));
      }
    } catch {
      addToast("Gagal Memuat Hadits", "Terjadi kesalahan koneksi.", "warning");
    } finally {
      setIsLoadingHadiths(false);
    }
  };

  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
        <button
          onClick={() => {
            if (selectedBook) {
              setSelectedBook(null);
              setHadiths([]);
            } else if (onBack) {
              onBack();
            }
          }}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
        </button>
        <div>
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">
            Kumpulan Hadits
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            {selectedBook
              ? `KITAB ${selectedBook.name} (1-50)`
              : "Rujukan Sunnah Nabawiyyah"}
          </p>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {!selectedBook ? (
            <motion.div
              key="books"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col items-center py-8 text-center bg-white rounded-3xl border border-emerald-100/50 shadow-sm mb-2 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-2xl opacity-60"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-50 rounded-full blur-2xl opacity-60"></div>

                <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-[#0F4C3A] rounded-2xl flex items-center justify-center rotate-3 mb-4 shadow-sm border border-emerald-200/50 relative z-10">
                  <Scroll className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif font-bold text-[#0F4C3A] text-xl relative z-10">
                  Kutubus Sittah
                </h3>
                <p className="text-xs text-emerald-800/70 font-medium mt-1.5 relative z-10">
                  Perpustakaan kitab hadits Shahih & Sunan.
                </p>
              </div>

              {isLoadingBooks ? (
                <LoaderLogo />
              ) : books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {books.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className="bg-white border border-slate-200/60 p-4 rounded-[24px] text-left hover:border-emerald-300 hover:shadow-md transition-all focus:outline-none cursor-pointer flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#0F4C3A] group-hover:text-[#ECC17A] group-hover:border-emerald-900 transition-colors shadow-sm">
                        <Book className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#0F4C3A] transition-colors">
                          {book.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                          <BookOpenCheck className="w-3 h-3" />
                          {book.available.toLocaleString()} Hadits
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 text-slate-400 flex flex-col items-center">
                  <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-semibold">
                    Gagal memuat daftar kitab.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="hadiths"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {isLoadingHadiths ? (
                <LoaderLogo />
              ) : hadiths.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {hadiths.map((h, i) => (
                    <div
                      key={h.number}
                      className="bg-white border border-slate-200/60 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50/50 to-transparent rounded-bl-full pointer-events-none"></div>

                      <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 flex items-center justify-center bg-[#0F4C3A] text-white font-bold text-xs rounded-xl shadow-sm">
                            {h.number}
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Hadits Riwayat
                          </span>
                        </div>
                      </div>

                      <p
                        className="font-arabic text-[26px] sm:text-[30px] leading-[2.5] text-right text-slate-800 mb-8 mt-2"
                        dir="rtl"
                      >
                        {h.arab}
                      </p>

                      <div className="bg-[#FDFBF7] border border-slate-100 rounded-2xl p-4">
                        <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                          "{h.id}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 text-slate-400 flex flex-col items-center">
                  <p
                    className="text-sm font-semibold hover:underline cursor-pointer"
                    onClick={() => handleSelectBook(selectedBook)}
                  >
                    Gagal memuat/kosong. Coba lagi.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
};
