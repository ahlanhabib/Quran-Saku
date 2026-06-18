import { PageContainer } from "./PageContainer";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Search,
  BookMarked
} from "lucide-react";
import { fikihBooks, FikihBook, FikihChapter } from "../data/fikihData";

interface FikihViewProps {
  onBack?: () => void;
}

export const FikihView: React.FC<FikihViewProps> = ({ onBack }) => {
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeBook = useMemo(() => 
    fikihBooks.find((b) => b.id === activeBookId) || null,
  [activeBookId]);

  const activeChapter = useMemo(() => 
    activeBook?.chapters.find((c) => c.id === activeChapterId) || null,
  [activeBook, activeChapterId]);

  // Search logic across all books and articles
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { book: FikihBook, chapter: FikihChapter, article: any }[] = [];
    
    fikihBooks.forEach(book => {
      book.chapters.forEach(chapter => {
        chapter.articles.forEach(article => {
          if (
            article.title.toLowerCase().includes(q) || 
            article.translation.toLowerCase().includes(q) ||
            (article.arabic && article.arabic.includes(q))
          ) {
            results.push({ book, chapter, article });
          }
        });
      });
    });
    return results;
  }, [searchQuery]);

  const handleBack = () => {
    if (activeChapterId) {
      setActiveChapterId(null);
    } else if (activeBookId) {
      setActiveBookId(null);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
          </button>
          <div>
            <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight line-clamp-1">
              {activeChapter ? activeChapter.title : activeBook ? activeBook.title : "Ensiklopedia Fikih"}
            </h3>
            <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5 line-clamp-1">
              {activeChapter ? activeBook?.title : activeBook ? activeBook.author : "Rujukan Kitab Klasik"}
            </p>
          </div>
        </div>

        {!activeBookId && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari hukum, dalil, atau bab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A] transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {searchQuery.trim() ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Hasil Pencarian ({searchResults.length})
              </h4>
              <div className="flex flex-col gap-3">
                {searchResults.map((res, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/60 rounded-[20px] p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                        {res.book.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded-md">
                        {res.chapter.title}
                      </span>
                    </div>
                    <h5 className="font-bold text-[#0F4C3A] text-sm mb-2">{res.article.title}</h5>
                    {res.article.arabic && (
                      <p className="font-arabic text-xl leading-relaxed text-right mb-3 text-slate-800" dir="rtl">
                        {res.article.arabic}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {res.article.translation}
                    </p>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Tidak ditemukan hasil untuk "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          ) : !activeBookId ? (
            <motion.div
              key="books"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="bg-gradient-to-br from-[#0F4C3A] to-emerald-900 border border-emerald-800 p-6 rounded-[28px] relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <BookOpen className="w-10 h-10 text-[#ECC17A] mb-4 relative z-10 opacity-90" />
                <h4 className="font-serif font-bold text-[#ECC17A] text-xl relative z-10">
                  Kepustakaan Fikih
                </h4>
                <p className="text-xs text-emerald-100/80 font-medium mt-1.5 relative z-10 leading-relaxed max-w-[90%]">
                  Kumpulan rujukan bab syariat dan ibadah dari kitab-kitab klasik mumpuni para ulama.
                </p>
              </div>

              <div className="grid gap-3.5 mt-2">
                {fikihBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setActiveBookId(book.id)}
                    className="flex flex-col gap-3 p-5 border border-slate-200/60 rounded-[24px] bg-white shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                          <BookMarked className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-[15px] group-hover:text-[#0F4C3A] transition-colors">
                            {book.title}
                          </h4>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            Karya {book.author}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#0F4C3A] transition-colors shrink-0">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ECC17A] transition-colors" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {book.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wide">
                        {book.chapters.length} Bab Fikih
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : !activeChapterId && activeBook ? (
            <motion.div
              key="chapters"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Bab (Daftar Isi)
                </h4>
              </div>
              {activeBook.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapterId(chapter.id)}
                  className="bg-white border border-slate-200/60 rounded-[20px] p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group cursor-pointer text-left"
                >
                  <span className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-[#0F4C3A] group-hover:text-[#ECC17A] transition-colors">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-[14px] group-hover:text-[#0F4C3A] transition-colors">
                      {chapter.title}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                      {chapter.articles.length} Pasal Pembahasan
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4C3A] transition-colors" />
                </button>
              ))}
            </motion.div>
          ) : activeChapter ? (
            <motion.div
              key="articles"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              {activeChapter.articles.map((article, idx) => (
                <div
                  key={article.id}
                  className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-[#0F4C3A] text-sm">{article.title}</h3>
                  </div>
                  
                  {article.arabic && (
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <p className="font-arabic text-2xl leading-[2.2] text-right text-slate-800" dir="rtl">
                        {article.arabic}
                      </p>
                    </div>
                  )}

                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                    <span className="text-[#0F4C3A] font-bold mr-1">Artinya:</span>
                    {article.translation}
                  </p>
                </div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
};
