/**
 * @author Habib Ismail Al Qadri
 * @app Quran Saku
 */
import { PageContainer } from "./PageContainer";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { get, set } from "idb-keyval";
import {
  BookOpen,
  Search,
  Clock,
  ArrowLeft,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  BookOpenCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  ChevronRight,
  HelpCircle,
  FileText,
  WifiOff,
  Maximize2,
  XCircle
} from "lucide-react";
import {
  Surah,
  SurahDetail,
  Ayat,
  Bookmark as BookmarkType,
  Note,
} from "../types";
import { STATIC_SURAHS } from "../data";

interface QuranReaderProps {
  bookmarks: BookmarkType[];
  addBookmark: (b: BookmarkType) => void;
  removeBookmark: (surahNo: number, ayatNo: number) => void;
  notes: Note[];
  addNote: (
    surahNo: number,
    surahName: string,
    ayatNo: number,
    txt: string,
  ) => void;
  deleteNote: (id: string) => void;
  updateTilawahProgress: (
    surahNo: number,
    surahName: string,
    ayatNo: number,
    totalAyat: number,
  ) => void;
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
  initialSelectedSurah: number | null;
  initialSelectedAyat?: number | null;
  resetInitialSelectedSurah: () => void;
}

export const QuranReader: React.FC<QuranReaderProps> = ({
  bookmarks,
  addBookmark,
  removeBookmark,
  notes,
  addNote,
  deleteNote,
  updateTilawahProgress,
  addToast,
  initialSelectedSurah,
  initialSelectedAyat,
  resetInitialSelectedSurah,
}) => {
  // Surahs list
  const [surahs, setSurahs] = useState<Surah[]>(STATIC_SURAHS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const surahDetailRef = useRef<SurahDetail | null>(null);

  useEffect(() => {
    surahDetailRef.current = surahDetail;
  }, [surahDetail]);

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Audio players
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAyatNo, setPlayingAyatNo] = useState<number | null>(null);

  // Modal active flags
  const [activeTafsirAyat, setActiveTafsirAyat] = useState<{
    ayatNo: number;
    teks: string;
  } | null>(null);
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
  const [activeNoteForm, setActiveNoteForm] = useState<{
    surahNo: number;
    surahName: string;
    ayatNo: number;
  } | null>(null);
  const [noteInputText, setNoteInputText] = useState("");

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refs for auto scrolling to a verse
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Hit API on startup to fetch updated Surah list if possible
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const cachedSurahs = await get("surahs_list");
        if (cachedSurahs) {
          setSurahs(cachedSurahs);
        }

        if (navigator.onLine) {
          const response = await fetch("https://api.quran.gading.dev/surah");
          if (!response.ok) throw new Error();
          const payload = await response.json();
          if (payload.code === 200 && Array.isArray(payload.data)) {
            const transformedData = payload.data.map((s: any) => ({
              nomor: s.number,
              nama: s.name.short,
              namaLatin: s.name.transliteration.id,
              jumlahAyat: s.numberOfVerses,
              tempatTurun: s.revelation.id,
              arti: s.name.translation.id,
              deskripsi: s.tafsir.id,
              audioFull: {
                "05":
                  "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/" +
                  s.number +
                  ".mp3",
              },
            }));
            setSurahs(transformedData);
            set("surahs_list", transformedData).catch(console.error);
          }
        }
      } catch (err) {
        // Fallback is static data which is already loaded
        console.warn("Using offline static Surah database");
      }
    };
    fetchSurahs();
  }, []);

  // Check if deep linked from Home (e.g., loaded with initialSelectedSurah)
  const [pendingScrollAyat, setPendingScrollAyat] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (initialSelectedSurah) {
      const match = surahs.find((s) => s.nomor === initialSelectedSurah);
      if (match) {
        if (initialSelectedAyat) setPendingScrollAyat(initialSelectedAyat);
        selectSurahHandler(match);
      }
      resetInitialSelectedSurah();
    }
  }, [initialSelectedSurah, initialSelectedAyat, surahs]);

  useEffect(() => {
    if (surahDetail && pendingScrollAyat) {
      let attempts = 0;
      const checkAndScroll = () => {
        const ayatEl = itemRefs.current[pendingScrollAyat];
        if (ayatEl) {
          setTimeout(() => {
            ayatEl.scrollIntoView({ behavior: "smooth", block: "center" });
            // add a subtle highlight animation by toggling a class
            ayatEl.classList.add("ring-4", "ring-[#ECC17A]", "scale-[1.02]", "transition-all", "duration-500");
            setTimeout(() => {
               ayatEl.classList.remove("ring-4", "ring-[#ECC17A]", "scale-[1.02]");
            }, 2000);
          }, 300);
          setPendingScrollAyat(null);
        } else if (attempts < 20) {
          attempts++;
          setTimeout(checkAndScroll, 100);
        }
      };
      checkAndScroll();
    }
  }, [surahDetail, pendingScrollAyat]);

  // Cleanup audio player when Surah changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingFull(false);
      setPlayingAyatNo(null);
    }
  }, [selectedSurah]);

  // Fetch Surah details
  const selectSurahHandler = async (surah: Surah) => {
    setSelectedSurah(surah);
    setIsLoadingDetail(true);
    setSurahDetail(null);
    itemRefs.current = {}; // Clear old refs before loading new surah
    try {
      const cacheKey = `surah_detail_${surah.nomor}`;
      const cachedDetail = await get(cacheKey);

      if (cachedDetail) {
        setSurahDetail(cachedDetail);
        setFullAudioUrl(cachedDetail.audioFull["05"]);
      }

      if (navigator.onLine || !cachedDetail) {
        const response = await fetch(
          `https://api.quran.gading.dev/surah/${surah.nomor}`,
        );
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (payload.code === 200 && payload.data) {
          const s = payload.data;
          const detailData = {
            nomor: s.number,
            nama: s.name.short,
            namaLatin: s.name.transliteration.id,
            jumlahAyat: s.numberOfVerses,
            tempatTurun: s.revelation.id,
            arti: s.name.translation.id,
            deskripsi: s.tafsir.id,
            audioFull: {
              "05":
                "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/" +
                s.number +
                ".mp3",
            },
            ayat: s.verses.map((v: any) => ({
              nomorAyat: v.number.inSurah,
              teksArab: v.text.arab,
              teksLatin: v.text.transliteration?.en || "",
              teksIndonesia: v.translation.id,
              tafsir: v.tafsir?.id?.long || "Tafsir belum tersedia.",
              audio: { "05": v.audio.primary },
            })),
          };
          setSurahDetail(detailData);
          setFullAudioUrl(detailData.audioFull["05"]);
          set(cacheKey, detailData).catch(console.error);
        }
      }
    } catch {
      // If API fails (e.g. CORS or offline), show an error toast
      addToast(
        "Koneksi Error",
        `Gagal memuat Surat ${surah.namaLatin}. Gagal menghubungi server MyQuran API.`,
        "warning",
      );
      setSelectedSurah(null); // Return back to list so user not stuck in a dummy view
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Play full Surah audio
  const toggleFullAudio = () => {
    if (!fullAudioUrl) {
      addToast(
        "Audio Tidak Tersedia",
        "Koneksi audio sedang bermasalah.",
        "warning",
      );
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(fullAudioUrl);
      audioRef.current.onended = () => {
        setIsPlayingFull(false);
      };
    } else if (audioRef.current.src !== fullAudioUrl) {
      audioRef.current.pause();
      audioRef.current = new Audio(fullAudioUrl);
      audioRef.current.onended = () => {
        setIsPlayingFull(false);
      };
    }

    if (isPlayingFull) {
      audioRef.current.pause();
      setIsPlayingFull(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingFull(true))
        .catch(() =>
          addToast(
            "Izin Audio",
            "Browser memerlukan interaksi fisik sebelum memutar audio.",
            "warning",
          ),
        );
    }
  };

  // Play individual verse audio
  const toggleAyatAudio = (ayat: Ayat) => {
    const qariKey = Object.keys(ayat.audio)[0] || "05";
    const audioUrl = ayat.audio[qariKey];

    if (!audioUrl) {
      addToast("Audio Ayat Berkas Tidak Ada", "", "warning");
      return;
    }

    if (playingAyatNo === ayat.nomorAyat) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAyatNo(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => {
        setPlayingAyatNo(null);

        // Auto-play next verse if available
        const currentDetail = surahDetailRef.current;
        if (currentDetail && currentDetail.ayat) {
          const currentIndex = currentDetail.ayat.findIndex(
            (a) => a.nomorAyat === ayat.nomorAyat,
          );
          if (
            currentIndex !== -1 &&
            currentIndex + 1 < currentDetail.ayat.length
          ) {
            const nextAyat = currentDetail.ayat[currentIndex + 1];
            addToast(
              "Memutar Ayat Berikutnya",
              `Otomatis memutar ayat ${nextAyat.nomorAyat}`,
              "notification",
            );

            // Smoothly scroll to the next verse component
            setTimeout(() => {
              toggleAyatAudio(nextAyat);
              const nextEl = itemRefs.current[nextAyat.nomorAyat];
              if (nextEl) {
                nextEl.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 650);
          } else {
            addToast(
              "Hatam / Selesai Surat 🎉",
              `Alhamdulillah, selesai mendengarkan Surat ${currentDetail.namaLatin}.`,
              "success",
            );
          }
        }
      };

      audioRef.current = newAudio;
      setPlayingAyatNo(ayat.nomorAyat);
      audioRef.current.play().catch(() => {
        setPlayingAyatNo(null);
        addToast("Gagal memutar audio ayat", "", "warning");
      });
    }
  };

  // Handle Bookmarks
  const isBookmarked = (ayatNo: number) => {
    if (!selectedSurah) return false;
    return bookmarks.some(
      (b) => b.surahNo === selectedSurah.nomor && b.ayatNo === ayatNo,
    );
  };

  const handleBookmarkToggle = (ayatNo: number) => {
    if (!selectedSurah) return;
    if (isBookmarked(ayatNo)) {
      removeBookmark(selectedSurah.nomor, ayatNo);
      addToast(
        "Penanda Dihapus",
        `Menghapus QS ${selectedSurah.namaLatin}:${ayatNo} dari bookmark`,
        "info",
      );
    } else {
      addBookmark({
        surahNo: selectedSurah.nomor,
        surahName: selectedSurah.namaLatin,
        ayatNo,
        timestamp: Date.now(),
      });
      addToast(
        "Penanda Ditambahkan",
        `QS ${selectedSurah.namaLatin}:${ayatNo} berhasil ditambahkan ke bookmark`,
        "success",
      );
    }
  };

  // Read verse Tafsir from cached surah detail without refetching
  const handleTafsirClick = async (ayatNo: number) => {
    if (!selectedSurah || !surahDetail) return;

    const targetVerse = surahDetail.ayat.find((v) => v.nomorAyat === ayatNo);

    if (targetVerse && targetVerse.tafsir) {
      setActiveTafsirAyat({
        ayatNo,
        teks: targetVerse.tafsir,
      });
    } else {
      setActiveTafsirAyat({
        ayatNo,
        teks: "Tafsir ayat belum diunduh dengan sempurna. Coba muat ulang surah ini saat online.",
      });
    }
  };

  // Submit Note Formulation
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteForm || !noteInputText.trim()) return;

    addNote(
      activeNoteForm.surahNo,
      activeNoteForm.surahName,
      activeNoteForm.ayatNo,
      noteInputText,
    );

    addToast(
      "Catatan Disimpan!",
      `Mencatatkan refleksi spiritual pada QS ${activeNoteForm.surahName}:${activeNoteForm.ayatNo}`,
      "success",
    );

    setActiveNoteForm(null);
    setNoteInputText("");
  };

  // Log progress tilawah
  const markTilawahProgress = (ayat: Ayat) => {
    if (!selectedSurah) return;
    updateTilawahProgress(
      selectedSurah.nomor,
      selectedSurah.namaLatin,
      ayat.nomorAyat,
      selectedSurah.jumlahAyat,
    );
    addToast(
      "Mencatat Tilawah ✅",
      `Progress diperbarui kemajuan tilawah: ${selectedSurah.namaLatin} Ayat ${ayat.nomorAyat}`,
      "success",
    );
  };

  const filteredSurahs = surahs.filter((surah) => {
    const query = searchQuery.toLowerCase();
    return (
      surah.namaLatin.toLowerCase().includes(query) ||
      surah.arti.toLowerCase().includes(query) ||
      surah.tempatTurun.toLowerCase().includes(query) ||
      surah.nomor.toString() === query
    );
  });

  return (
    <PageContainer className="gap-6">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-in fade-in slide-in-from-top-4">
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <span>
            Anda sedang offline. Menampilkan data dari cache memori perangkat.
            Fitur audio dan tafsir mungkin terbatas.
          </span>
        </div>
      )}

      {/* Search and listings section */}
      {!selectedSurah ? (
        <div className="flex flex-col gap-5">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0F4C3A] to-emerald-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-[#0F4C3A]/20">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[#ECC17A] text-[10px] font-bold tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                MUSHAF AL-QUR'AN DIGITAL
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                Bacalah dan Hayati Al-Qur'an
              </h2>
              <p className="text-xs text-teal-100/80 max-w-sm mt-1 leading-relaxed">
                Pencarian instan surah, tafsir mendalam, penanda bacaan dan
                putar audio ayat mutawatir.
              </p>
            </div>
          </div>

          {/* Search Box Filters */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Surah (cth: Kahf, Yasin, Al-Mulk, atau terjemahan)..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 transition-all font-medium"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          </div>

          {/* Grid of Surah list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSurahs.map((surah) => (
              <motion.div
                key={surah.nomor}
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => selectSurahHandler(surah)}
                className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Surah Numbering Container */}
                  <div className="w-10 h-10 aspect-square rounded-xl bg-emerald-50 text-emerald-800 font-serif font-bold text-sm flex items-center justify-center border border-emerald-100 flex-shrink-0">
                    {surah.nomor}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 leading-none truncate text-base hover:text-[#0F4C3A]">
                      {surah.namaLatin}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 truncate font-medium">
                      {surah.arti} • {surah.jumlahAyat} Ayat
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[#0F4C3A] font-serif font-bold text-lg leading-none">
                      {surah.nama}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider mt-1 block">
                      {surah.tempatTurun.toUpperCase()}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-1.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Detailed Mushaf Surah Reader */
        <div className="flex flex-col gap-5">
          {/* Back button button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedSurah(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Surah
            </button>
            <button
              onClick={() => setIsFocusMode(true)}
              className="px-4 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              Focus Mode
            </button>
          </div>

          {/* Detailed Surah Header Card banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-[#0F4C3A] to-teal-900 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden">
            {/* Islamic visual mandala arches */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ECC17A_2px,transparent_2px)] [background-size:20px_20px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-xs font-bold text-[#ECC17A] tracking-widest uppercase">
                SURAT KE-{selectedSurah.nomor}
              </span>
              <h2 className="text-4xl font-serif font-bold mt-2 text-white">
                {selectedSurah.namaLatin}
              </h2>
              <p className="text-sm text-teal-100/90 italic font-medium mt-1">
                ({selectedSurah.arti})
              </p>

              {/* Gold boundary list marker */}
              <div className="w-40 h-[1px] bg-[#ECC17A]/40 my-3.5"></div>

              <p className="text-xs font-semibold text-teal-50 tracking-wider uppercase">
                {selectedSurah.tempatTurun} • {selectedSurah.jumlahAyat} AYAT
              </p>

              {/* Full audio player layout */}
              <button
                onClick={toggleFullAudio}
                className="mt-5 px-6 py-2.5 bg-[#ECC17A] text-[#0F4C3A] hover:bg-amber-400 transition-colors rounded-full text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {isPlayingFull ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isPlayingFull ? "Jeda Audio Surah" : "Dengarkan Audio Surah"}
              </button>
            </div>
          </div>

          {/* Arabic Bismillah (omit for Surah Al-Fatihah/At-Taubah in general layouts, or show beautifully) */}
          {selectedSurah.nomor !== 1 && selectedSurah.nomor !== 9 && (
            <div className="bg-white border border-slate-100 p-5 sm:p-8 rounded-2xl text-center shadow-sm select-none">
              <span className="font-serif text-xl sm:text-3xl font-bold text-slate-800 tracking-wider leading-loose">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </span>
              <p className="text-slate-400 text-xs mt-3.5 font-semibold">
                Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.
              </p>
            </div>
          )}

          {/* Verses Loader */}
          {isLoadingDetail ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <div className="w-12 h-6 rounded-xl bg-slate-200 animate-pulse"></div>
                    <div className="w-32 h-6 rounded-xl bg-slate-100 animate-pulse"></div>
                  </div>
                  <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse mb-4"></div>
                  <div className="h-4 w-3/4 bg-slate-100 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-slate-100 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {surahDetail?.ayat.map((ayat, index) => {
                const isSaved = isBookmarked(ayat.nomorAyat);
                const isPlaying = playingAyatNo === ayat.nomorAyat;
                const ayatNotes = notes.filter(
                  (n) =>
                    n.surahNo === selectedSurah.nomor &&
                    n.ayatNo === ayat.nomorAyat,
                );

                return (
                  <div
                    key={ayat.nomorAyat}
                    ref={(el) => {
                      itemRefs.current[ayat.nomorAyat] = el;
                    }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-5 relative group"
                  >
                    {/* Verse actions navigation header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                      {/* Circle Identity */}
                      <div className="px-3.5 py-1.5 bg-emerald-50 rounded-xl text-[#0F4C3A] font-serif font-bold text-xs self-start">
                        {selectedSurah.nomor}:{ayat.nomorAyat}
                      </div>

                      {/* Quick tool row */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {/* Play ayat audio */}
                        <button
                          onClick={() => toggleAyatAudio(ayat)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            isPlaying
                              ? "bg-amber-100 border-amber-300 text-amber-800"
                              : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                          }`}
                          title="Dengarkan Ayat"
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Bookmark checkbox toggle */}
                        <button
                          onClick={() => handleBookmarkToggle(ayat.nomorAyat)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            isSaved
                              ? "bg-emerald-100 border-emerald-300 text-[#0F4C3A]"
                              : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                          }`}
                          title="Tandai Ayat"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Reflections/Notes creator button */}
                        <button
                          onClick={() =>
                            setActiveNoteForm({
                              surahNo: selectedSurah.nomor,
                              surahName: selectedSurah.namaLatin,
                              ayatNo: ayat.nomorAyat,
                            })
                          }
                          className="p-2 bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 cursor-pointer rounded-xl transition-colors"
                          title="Tulis Catatan / Refleksi"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Tafsir digital fetch */}
                        <button
                          onClick={() => handleTafsirClick(ayat.nomorAyat)}
                          className="p-2 bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 cursor-pointer rounded-xl transition-colors"
                          title="Lihat Tafsir"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Mark reading tilawah progress log */}
                        <button
                          onClick={() => markTilawahProgress(ayat)}
                          className="px-2.5 py-2 bg-emerald-50 border border-emerald-100 text-[#0F4C3A] hover:bg-emerald-100 cursor-pointer rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
                          title="Logging terakhir dibaca"
                        >
                          <BookOpenCheck className="w-3.5 h-3.5 text-[#0F4C3A]" />
                          Sudah Dibaca
                        </button>
                      </div>
                    </div>

                    {/* Arabic scripture calligraphy - extremely elegant */}
                    <div className="text-right py-4 font-serif text-3xl sm:text-4xl text-slate-800 leading-[2.2] select-all rtl ml-auto max-w-full">
                      {ayat.teksArab}
                    </div>

                    {/* Latin transliteration and meaning */}
                    <div className="flex flex-col gap-2">
                      <p className="text-emerald-800 text-xs sm:text-sm font-medium italic select-text leading-relaxed">
                        {ayat.teksLatin}
                      </p>
                      <p className="text-slate-600 text-xs sm:text-sm select-text leading-relaxed font-normal">
                        {ayat.teksIndonesia}
                      </p>
                    </div>

                    {/* Integrated user notes/contributions log listing if any exists for this verse */}
                    {ayatNotes.length > 0 && (
                      <div className="mt-2 bg-slate-50 rounded-2xl p-4 flex flex-col gap-2 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                          CATATAN REFLEKSI ANDA:
                        </span>
                        {ayatNotes.map((note) => (
                          <div
                            key={note.id}
                            className="text-xs text-slate-700 flex gap-2 justify-between items-start"
                          >
                            <p className="leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-100 flex-1">
                              {note.text}
                            </p>
                            <button
                              onClick={() => {
                                deleteNote(note.id);
                                addToast(
                                  "Catatan Dihapus",
                                  "Menghapus catatan refleksi.",
                                  "info",
                                );
                              }}
                              className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 cursor-pointer rounded-lg bg-white border border-red-100"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Global Interactive Modal: Note Creator form */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {activeNoteForm && (
              <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom,20px)] sm:p-6 z-[90]">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-2xl flex flex-col gap-4 max-h-[85dvh] mb-4 sm:mb-0"
                >
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#0F4C3A]">
                      Tulis Catatan / Tadabbur
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Mencatatkan refleksi spiritual untuk Surat{" "}
                      {activeNoteForm.surahName} Ayat {activeNoteForm.ayatNo}
                    </p>
                  </div>

                  <form
                    onSubmit={handleNoteSubmit}
                    className="flex flex-col gap-4"
                  >
                    <textarea
                      value={noteInputText}
                      onChange={(e) => setNoteInputText(e.target.value)}
                      placeholder="Ketik refleksi spiritual, nasehat, atau pelajaran tadabbur yang Anda dapatkan dari ayat ini di sini..."
                      rows={4}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 leading-relaxed"
                    ></textarea>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNoteForm(null);
                          setNoteInputText("");
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 cursor-pointer text-slate-600 rounded-xl text-xs font-bold transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#0F4C3A] hover:bg-emerald-900 cursor-pointer text-white rounded-xl text-xs font-bold transition-all shadow"
                      >
                        Simpan Catatan
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Global Interactive Modal: Detailed Tafsir view */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {activeTafsirAyat && (
              <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom,20px)] sm:p-6 z-[90]">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85dvh] mb-4 sm:mb-0"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#0F4C3A]">
                        Tafsir Al-Qur'an Digital
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Surat {selectedSurah?.namaLatin} • Ayat{" "}
                        {activeTafsirAyat.ayatNo}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTafsirAyat(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-lg text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Scrollable text area */}
                  <div className="flex-1 overflow-y-auto p-6 leading-relaxed text-sm text-slate-700 whitespace-pre-wrap select-text">
                    {activeTafsirAyat.teks}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                      onClick={() => setActiveTafsirAyat(null)}
                      className="px-5 py-2 bg-[#0F4C3A] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Tutup Tafsir
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      {/* Focus Mode Overlay */}
      {isFocusMode && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-[#FDFBF7] z-[9999] flex flex-col overflow-y-auto w-full pb-[env(safe-area-inset-bottom,20px)] h-[100dvh]">
          <div className="sticky top-0 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between z-10">
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg text-[#0F4C3A]">{selectedSurah?.namaLatin}</span>
              <span className="text-xs text-slate-500 font-medium">{selectedSurah?.arti}</span>
            </div>
            <button 
              onClick={() => setIsFocusMode(false)}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Keluar
            </button>
          </div>
          <div className="p-4 sm:p-8 flex flex-col gap-10 max-w-4xl mx-auto w-full">
            {selectedSurah && selectedSurah.nomor !== 1 && selectedSurah.nomor !== 9 && (
              <div className="text-center select-none pt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-slate-800 tracking-wider leading-loose">
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                </span>
                <p className="text-slate-400 text-sm mt-3 font-semibold">Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.</p>
              </div>
            )}
            {surahDetail?.ayat.map(ayat => (
              <div key={ayat.nomorAyat} className="flex flex-col gap-6 py-4 border-b border-slate-100/60 last:border-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0F4C3A] flex items-center justify-center font-bold text-xs shrink-0 mt-2">
                    {ayat.nomorAyat}
                  </div>
                  <p className="font-serif text-3xl sm:text-5xl text-right leading-[2.5] sm:leading-[2.5] text-[#0F4C3A] w-full break-words tracking-normal" dir="rtl">
                    {ayat.teksArab}
                  </p>
                </div>
                <div className="pl-12 flex flex-col gap-2">
                  <p className="text-slate-500 text-sm sm:text-base italic leading-relaxed">{ayat.teksLatin}</p>
                  <p className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed">{ayat.teksIndonesia}</p>
                </div>
              </div>
            ))}
          </div>
        </div>, document.body
      )}
    </PageContainer>
  );
};
