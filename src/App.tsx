/**
 * @author Habib Ismail Al Qadri
 * @app Quran Saku
 */
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  BookOpen,
  Search,
  Heart,
  User,
  Bell,
  ChevronRight,
  BookMarked,
  HelpCircle,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  Play,
  Volume2,
  History,
  RotateCcw,
  PenTool,
  HandHeart,
  Compass,
  Scroll,
  LibraryBig,
  LayoutGrid,
  ArrowLeft,
  Bot,
  Radio,
  Calculator,
  Mic,
  Users,
  Star,
  Quote,
  MessageCircle
} from "lucide-react";

// Components
import { Splash } from "./components/Splash";
import { ToastContainer, ToastMessage } from "./components/Toast";
import { JadwalSholatWidget } from "./components/JadwalSholatWidget";
import { TargetKhatamWidget } from "./components/TargetKhatamWidget";
import { QuranReader } from "./components/QuranReader";
import { DoaHarianView } from "./components/DoaHarianView";
import { CariView } from "./components/CariView";
import { SettingsView } from "./components/SettingsView";
import { InstallPrompt } from "./components/InstallPrompt";
import { TasbihView } from "./components/TasbihView";
import { ArahKiblatView } from "./components/ArahKiblatView";
import { KalenderView } from "./components/KalenderView";
import { TafsirView } from "./components/TafsirView";
import { FikihView } from "./components/FikihView";
import { HaditsView } from "./components/HaditsView";
import { JurnalIbadahView } from "./components/JurnalIbadahView";
import { DzikirPagiPetangView } from "./components/DzikirPagiPetangView";
import { KalkulatorZakatView } from "./components/KalkulatorZakatView";
import { TanyaUstadzView } from "./components/TanyaUstadzView";
import { AsmaulHusnaView } from "./components/AsmaulHusnaView";
import { KisahNabiView } from "./components/KisahNabiView";
import { KalkulatorWarisView } from "./components/KalkulatorWarisView";
import { RadioIslamView } from "./components/RadioIslamView";
import { KhutbahJumatView } from "./components/KhutbahJumatView";
import { KumpulanShalawatView } from "./components/KumpulanShalawatView";
import { TadarusView } from "./components/TadarusView";

// Typings and Data
import { Bookmark, Note, TilawahProgress } from "./types";
import { App as CapacitorApp } from "@capacitor/app";

const AYAT_HARIAN_COLLECTION = [
  {
    surahId: 94,
    surahName: "Asy-Syarh",
    verseId: 5,
    arab: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    indonesian: "Karena sesungguhnya sesudah kesulitan itu ada kemudahan.",
  },
  {
    surahId: 94,
    surahName: "Asy-Syarh",
    verseId: 6,
    arab: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    indonesian: "Sesungguhnya sesudah kesulitan itu ada kemudahan.",
  },
  {
    surahId: 55,
    surahName: "Ar-Rahman",
    verseId: 60,
    arab: "هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ",
    indonesian: "Tidak ada balasan kebaikan kecuali kebaikan (pula).",
  },
  {
    surahId: 2,
    surahName: "Al-Baqarah",
    verseId: 152,
    arab: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    indonesian:
      "Maka ingatlah kepada-Ku, Aku pun akan ingat kepadamu. Bersyukurlah kepada-Ku, dan janganlah kamu ingkar kepada-Ku.",
  },
  {
    surahId: 2,
    surahName: "Al-Baqarah",
    verseId: 186,
    arab: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ",
    indonesian:
      "Dan apabila hamba-hamba-Ku bertanya kepadamu tentang Aku, maka (jawablah), bahwasanya Aku adalah dekat.",
  },
  {
    surahId: 2,
    surahName: "Al-Baqarah",
    verseId: 286,
    arab: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    indonesian:
      "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.",
  },
  {
    surahId: 3,
    surahName: "Ali 'Imran",
    verseId: 139,
    arab: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنْتُمُ الْأَعْلَوْنَ إِنْ كُنْتُمْ مُؤْمِنِينَ",
    indonesian:
      "Janganlah kamu bersikap lemah, dan janganlah (pula) kamu bersedih hati, padahal kamulah orang-orang yang paling tinggi derajatnya.",
  },
  {
    surahId: 3,
    surahName: "Ali 'Imran",
    verseId: 173,
    arab: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    indonesian:
      "Cukuplah Allah menjadi Penolong kami dan Allah adalah sebaik-baik Pelindung.",
  },
  {
    surahId: 13,
    surahName: "Ar-Ra'd",
    verseId: 28,
    arab: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    indonesian:
      "Ingatlah, hanya dengan mengingati Allah-lah hati menjadi tenteram.",
  },
  {
    surahId: 14,
    surahName: "Ibrahim",
    verseId: 7,
    arab: "لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    indonesian:
      "Sesungguhnya jika kamu bersyukur, pasti Kami akan menambah (nikmat) kepadamu.",
  },
  {
    surahId: 20,
    surahName: "Ta-Ha",
    verseId: 114,
    arab: "وَقُلْ رَبِّ زِدْنِي عِلْمًا",
    indonesian:
      "Dan katakanlah: 'Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan.'",
  },
  {
    surahId: 40,
    surahName: "Ghafir",
    verseId: 60,
    arab: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    indonesian:
      "Dan Tuhanmu berfirman: 'Berdoalah kepada-Ku, niscaya akan Kuperkenankan bagimu.'",
  },
  {
    surahId: 65,
    surahName: "At-Talaq",
    verseId: 2,
    arab: "وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا",
    indonesian:
      "Barangsiapa bertakwa kepada Allah niscaya Dia akan membukakan jalan keluar baginya.",
  },
  {
    surahId: 65,
    surahName: "At-Talaq",
    verseId: 3,
    arab: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    indonesian:
      "Dan Dia memberinya rezeki dari arah yang tidak disangka-sangkanya.",
  },
  {
    surahId: 93,
    surahName: "Ad-Duha",
    verseId: 5,
    arab: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
    indonesian:
      "Dan sungguh, kelak Tuhanmu pasti memberikan karunia-Nya kepadamu, sehingga engkau menjadi puas.",
  },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "beranda"
    | "quran"
    | "cari"
    | "doa"
    | "profil"
    | "tasbih"
    | "kiblat"
    | "kalender"
    | "tafsir"
    | "hadits"
    | "fikih"
    | "jurnal"
    | "dzikir"
    | "zakat"
    | "ustadz"
    | "asmaulHusna"
    | "kisahNabi"
    | "waris"
    | "radio"
    | "khutbah"
    | "shalawat"
    | "tadarus"
  >("beranda");
  const [subMenuLevel, setSubMenuLevel] = useState(0);

  // Auto-subscribe to push if permission is already granted
  useEffect(() => {
    const autoSyncPush = async () => {
      if ("Notification" in window && Notification.permission === "granted" && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
            return outputArray;
          };

          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            const response = await fetch('/api/push/public-key');
            if (!response.ok) return;
            const data = await response.json();
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(data.publicKey)
            });
          }

          const savedReminders = localStorage.getItem("qd_rutinReminders");
          const reminders = savedReminders ? JSON.parse(savedReminders) : undefined;
          
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription,
              rutinReminders: reminders,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })
          });
        } catch (e) {
          console.warn("Auto Push Sync Failed:", e);
        }
      }
    };
    autoSyncPush();
  }, []);

  // Sync state to History API for Android/Browser Back Button Support
  useEffect(() => {
    // Listen for back/forward navigation
    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        setActiveTab(e.state.tab || "beranda");
        setSubMenuLevel(e.state.sub || 0);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Precache popular surahs for reliable offline access
  useEffect(() => {
    const precacheSurahs = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('quran-api-cache');
          const urlsToCache = [
            'https://api.quran.gading.dev/surah',
            'https://api.quran.gading.dev/surah/1', // Al-Fatihah
            'https://api.quran.gading.dev/surah/18',// Al-Kahf
            'https://api.quran.gading.dev/surah/36',// Yasin
            'https://api.quran.gading.dev/surah/56',// Al-Waqi'ah
            'https://api.quran.gading.dev/surah/67',// Al-Mulk
          ];
          
          for (const url of urlsToCache) {
            const match = await cache.match(url);
            if (!match) {
              try {
                const response = await fetch(url);
                if (response.ok) {
                  await cache.put(url, response);
                }
              } catch (fetchErr) {
                console.warn(`Could not precache ${url}`, fetchErr);
              }
            }
          }
        } catch (e) {
          console.error("Failed to precache surahs:", e);
        }
      }
    };
    precacheSurahs();
  }, []);

  useEffect(() => {
    // Background watcher for Rutin Reminders
    const timer = setInterval(() => {
      const saved = localStorage.getItem("qd_rutinReminders");
      if (saved) {
        try {
          const rem = JSON.parse(saved);
          const now = new Date();
          const hr = String(now.getHours()).padStart(2, "0");
          const mn = String(now.getMinutes()).padStart(2, "0");
          const timeStr = `${hr}:${mn}`;
          
          const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()} ${timeStr}`;
          const lastTrigger = localStorage.getItem("qd_rutin_last_triggered");
          
          if (lastTrigger !== todayKey) {
            let matched: any = null;
            Object.values(rem).forEach((r: any) => {
              if (r.enable && r.time === timeStr) {
                if (r.days && Array.isArray(r.days) && !r.days.includes(now.getDay())) {
                  return; // Skip if restricted by days
                }
                matched = r;
              }
            });
            
            if (matched) {
              localStorage.setItem("qd_rutin_last_triggered", todayKey);
              addToast(
                `Waktunya ${matched.name}!`,
                `Saatnya menunaikan kegiatan ibadah rutin Anda: ${matched.name}.`,
                  "notification"
                );
                
                if ("Notification" in window && Notification.permission === "granted") {
                  try {
                    navigator.serviceWorker.ready.then((reg) => {
                      reg.showNotification(`Pengingat: ${matched.name}`, {
                        body: `Waktunya menunaikan kegiatan ibadah rutin Anda.`,
                        icon: "/icons/icon-192x192.png",
                        badge: "/icons/icon-192x192.png",
                        vibrate: [300, 100, 300, 100, 300],
                        tag: `rutin-${matched.name}`,
                      } as any);
                    });
                  } catch(e) {}
                }
              }
            }
        } catch(e) {}
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update history state when tabs or submenus change
  useEffect(() => {
    const currentState = window.history.state;
    // If the state is different from what's currently in history, push a new state
    if (
      !currentState ||
      currentState.tab !== activeTab ||
      currentState.sub !== subMenuLevel
    ) {
      // If it's the very first load and we're just syncing defaults, replace instead of push
      if (!currentState && activeTab === "beranda" && subMenuLevel === 0) {
        window.history.replaceState(
          { tab: activeTab, sub: subMenuLevel },
          "",
          `#${activeTab}`,
        );
      } else {
        window.history.pushState(
          { tab: activeTab, sub: subMenuLevel },
          "",
          `#${activeTab}${subMenuLevel > 0 ? `-menu-${subMenuLevel}` : ""}`,
        );
      }
    }
  }, [activeTab, subMenuLevel]);

  // Handle Android Physical Back Button for Capacitor (fallback)
  useEffect(() => {
    const handleBackButton = async () => {
      if (subMenuLevel > 0) {
        setSubMenuLevel(prev => prev - 1);
      } else if (activeTab !== "beranda") {
        setActiveTab("beranda");
      } else {
        await CapacitorApp.exitApp();
      }
    };

    const backListener = CapacitorApp.addListener(
      "backButton",
      handleBackButton,
    );

    return () => {
      backListener.then((listener) => listener.remove());
    };
  }, [activeTab, subMenuLevel]);

  // Notifications/Toasts System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (
    title: string,
    body: string,
    type: ToastMessage["type"],
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, body, type }]);

    // Auto remove toast in 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State: Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const cached = localStorage.getItem("qs_bookmarks");
    return cached ? JSON.parse(cached) : [];
  });

  // State: Notes
  const [notes, setNotes] = useState<Note[]>(() => {
    const cached = localStorage.getItem("qs_notes");
    return cached ? JSON.parse(cached) : [];
  });

  // State: Tilawah logs & progress tracker
  const [tilawahProgress, setTilawahProgress] = useState<TilawahProgress>(
    () => {
      const cached = localStorage.getItem("qs_progress");
      return cached
        ? JSON.parse(cached)
        : {
            currentSurah: 1,
            currentSurahName: "Al-Fatihah",
            currentAyat: 1,
            totalAyat: 7,
            progressPercentage: 0,
          };
    },
  );

  // Daily Reading Target
  const [dailyReadingTime, setDailyReadingTime] = useState(() => {
    return parseInt(localStorage.getItem("qs_daily_time") || "0");
  });

  const updateDailyReadingTime = (incrementMins: number) => {
    const newVal = Math.min(dailyReadingTime + incrementMins, 15);
    setDailyReadingTime(newVal);
    localStorage.setItem("qs_daily_time", newVal.toString());
    addToast(
      "Waktu Berlalu",
      `Tercatat +${incrementMins} menit untuk target harian Anda.`,
      "success",
    );
  };

  // State: User profile parameters
  const [userName, setUserName] = useState(
    () => localStorage.getItem("qs_username") || "Habib Ismail Al Qadri",
  );
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(
    () => Number(localStorage.getItem("qs_goal")) || 15,
  );
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem("qs_gemini_key") || "",
  );
  
  const [isNightMode, setIsNightMode] = useState(
    () => localStorage.getItem("qs_nightmode") === "true"
  );
  
  useEffect(() => {
    localStorage.setItem("qs_nightmode", isNightMode.toString());
    if (isNightMode) {
      document.documentElement.classList.add("night-mode");
      document.body.style.backgroundColor = "#121212";
    } else {
      document.documentElement.classList.remove("night-mode");
      document.body.style.backgroundColor = "#FDFBF7";
    }
  }, [isNightMode]);

  // Jump from Home / search directly into Specific Surah details
  const [deepLinkSurah, setDeepLinkSurah] = useState<number | null>(null);
  const [deepLinkAyat, setDeepLinkAyat] = useState<number | null>(null);

  // Note: We initialize all local persistence from useState initializers directly now.

  // Save persistence when states adjust using useEffect for real-time synchronization
  useEffect(() => {
    localStorage.setItem("qs_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("qs_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("qs_progress", JSON.stringify(tilawahProgress));
  }, [tilawahProgress]);

  const handleAddBookmark = (b: Bookmark) => {
    const updated = [...bookmarks, b];
    setBookmarks(updated);
  };

  const handleRemoveBookmark = (surahNo: number, ayatNo: number) => {
    const updated = bookmarks.filter(
      (b) => !(b.surahNo === surahNo && b.ayatNo === ayatNo),
    );
    setBookmarks(updated);
  };

  const handleAddNote = (
    surahNo: number,
    surahName: string,
    ayatNo: number,
    txt: string,
  ) => {
    const entry: Note = {
      id: Math.random().toString(36).substring(2, 9),
      surahNo,
      surahName,
      ayatNo,
      text: txt,
      timestamp: Date.now(),
    };
    const updated = [entry, ...notes];
    setNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
  };

  const handleUpdateTilawahProgress = (
    surahNo: number,
    surahName: string,
    ayatNo: number,
    totalAyat: number,
  ) => {
    const percentage = Math.round((ayatNo / totalAyat) * 100);
    const updated: TilawahProgress = {
      currentSurah: surahNo,
      currentSurahName: surahName,
      currentAyat: ayatNo,
      totalAyat,
      progressPercentage: percentage,
    };
    setTilawahProgress(updated);
  };

  const handleSetUserName = (n: string) => {
    setUserName(n);
    localStorage.setItem("qs_username", n);
  };

  const handleSetDailyGoalMinutes = (m: number) => {
    setDailyGoalMinutes(m);
    localStorage.setItem("qs_goal", m.toString());
  };

  const handleSetGeminiApiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem("qs_gemini_key", key);
  };

  // Jump page reader
  const handleJumpToSurah = (surahNo: number, ayatNo?: number) => {
    setDeepLinkSurah(surahNo);
    if (ayatNo) setDeepLinkAyat(ayatNo);
    setActiveTab("quran");
  };

  // Get localized Islamic greeting and greeting based on current local time
  const [greetingText, setGreetingText] = useState("Selamat datang!");
  const [timeOfDay, setTimeOfDay] = useState("malam");

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 11) {
      setGreetingText("Selamat Pagi!");
      setTimeOfDay("pagi");
    } else if (hr >= 11 && hr < 15) {
      setGreetingText("Selamat Siang!");
      setTimeOfDay("siang");
    } else if (hr >= 15 && hr < 19) {
      setGreetingText("Selamat Sore!");
      setTimeOfDay("sore");
    } else {
      setGreetingText("Selamat Malam!");
      setTimeOfDay("malam");
    }
  }, []);

  // Verse of the day visual selection - Sliding collection changing daily
  const dayOfYear = Math.floor(Date.now() / 86400000);
  const todaysAyats = useMemo(() => {
    const ayats = [];
    const startIndex = (dayOfYear * 5) % AYAT_HARIAN_COLLECTION.length;
    for (let i = 0; i < 5; i++) {
      ayats.push(
        AYAT_HARIAN_COLLECTION[
          (startIndex + i) % AYAT_HARIAN_COLLECTION.length
        ],
      );
    }
    return ayats;
  }, [dayOfYear]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % 5);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const ayatOfTheDay = todaysAyats[currentSlideIndex];

  const shareAyatOfTheDay = () => {
    const text = `*Ayat Hari Ini (QS ${ayatOfTheDay.surahName}:${ayatOfTheDay.verseId})*\n\n${ayatOfTheDay.arab}\n\n"${ayatOfTheDay.indonesian}"\n\n- Dibagikan via Quran Saku App -`;
    navigator.clipboard.writeText(text);
    addToast(
      "Teks Disalin",
      "Ayat hari ini disalin ke clipboard untuk Anda bagikan.",
      "success",
    );
  };

  // Switcher rendering of tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case "beranda":
        return (
          <div className="flex flex-col gap-6 -mt-[125px] sm:-mt-[145px] relative z-20 w-full max-w-2xl lg:max-w-4xl mx-auto">
            {/* Ayat Hari Ini (Verse of the day card) */}
            <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white/60 flex flex-col gap-3 relative overflow-hidden select-none z-10 w-full mb-2 mx-auto max-w-2xl">
              {/* Corner label row */}
              <div className="flex justify-between items-center text-slate-500 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Sparkles className="w-4 h-4 fill-amber-100/55" />
                  <span className="font-extrabold text-slate-800 font-sans tracking-wide">
                    Ayat Hari Ini
                  </span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={ayatOfTheDay.surahId + "-" + ayatOfTheDay.verseId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="font-sans tracking-wide text-slate-400 font-bold"
                    >
                      {ayatOfTheDay.surahName} · {ayatOfTheDay.surahId}:
                      {ayatOfTheDay.verseId}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Quran script */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={ayatOfTheDay.arab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="py-2.5 text-center mt-1"
                >
                  <p
                    className="font-serif text-2xl font-bold leading-relaxed text-slate-800 px-1"
                    dir="rtl"
                  >
                    {ayatOfTheDay.arab}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Translation */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={ayatOfTheDay.indonesian}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans font-medium text-left px-1 mt-1 border-t border-slate-50 pt-3"
                >
                  {ayatOfTheDay.indonesian}
                </motion.p>
              </AnimatePresence>

              {/* Tool row actions */}
              <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-50">
                {/* Square Share/Upload Button resembling the mockup */}
                <button
                  onClick={shareAyatOfTheDay}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-xl transition cursor-pointer"
                  title="Bagikan Ayat"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleJumpToSurah(ayatOfTheDay.surahId)}
                  className="text-xs font-bold text-slate-800 hover:text-[#0F4C3A] flex items-center gap-1.5 cursor-pointer transition select-none pr-1"
                >
                  Baca Ayat <BookOpen className="w-3.5 h-3.5 text-slate-400" />{" "}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Main menu 8-grid grid listed under the screenshot */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm overflow-hidden relative min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`menu-level-${subMenuLevel}`}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-y-5 gap-x-2 sm:gap-x-4"
                  >
                    {(() => {
                      const menus = {
                        0: [
                          { tag: "Al-Qur'an", action: () => setActiveTab("quran"), bg: "bg-[#EDF4F1] text-[#0F4C3A]", icon: <BookOpen className="w-5.5 h-5.5" /> },
                          { tag: "Terakhir Baca", action: () => handleJumpToSurah(tilawahProgress.currentSurah, tilawahProgress.currentAyat), bg: "bg-[#FDF7E7] text-amber-700", icon: <Clock className="w-5.5 h-5.5" /> },
                          { tag: "Arah Kiblat", action: () => { setActiveTab("kiblat"); addToast("Arah Kiblat", "Membuka navigator kiblat.", "info"); }, bg: "bg-[#EDF6F5] text-teal-700", icon: <Compass className="w-5.5 h-5.5" /> },
                          { tag: "Kalender", action: () => { setActiveTab("kalender"); addToast("Kalender Hijriah", "Membuka penanggalan Islam.", "info"); }, bg: "bg-[#F7F2EC] text-amber-900", icon: <Calendar className="w-5.5 h-5.5" /> },
                          { tag: "Tafsir", action: () => setActiveTab("tafsir"), bg: "bg-[#F3EEF8] text-purple-700", icon: <FileText className="w-5.5 h-5.5" /> },
                          { tag: "Doa Harian", action: () => setActiveTab("doa"), bg: "bg-[#FDF2EB] text-orange-700", icon: <HandHeart className="w-5.5 h-5.5" /> },
                          { tag: "Jadwal Sholat", action: () => {
                            const el = document.getElementById("jadwal-sholat-widget-container");
                            if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); addToast("Jadwal Sholat", "Menampilkan panel jadwal sholat.", "info"); }
                          }, bg: "bg-[#EEF6FA] text-sky-700", icon: <Calendar className="w-5.5 h-5.5" /> },
                          { tag: "Lainnya", action: () => setSubMenuLevel(1), bg: "bg-[#F5F5F5] text-slate-700", icon: <LayoutGrid className="w-5.5 h-5.5" /> },
                        ],
                        1: [
                          { tag: "Kembali", action: () => setSubMenuLevel(0), bg: "bg-[#F5F5F5] text-slate-500", icon: <ArrowLeft className="w-5.5 h-5.5" /> },
                          { tag: "Jurnal", action: () => setActiveTab("jurnal"), bg: "bg-[#F0FDF4] text-emerald-600", icon: <PenTool className="w-5.5 h-5.5" /> },
                          { tag: "Dzikir", action: () => setActiveTab("dzikir"), bg: "bg-[#FFFCE8] text-amber-600", icon: <Heart className="w-5.5 h-5.5" /> },
                          { tag: "Zakat", action: () => setActiveTab("zakat"), bg: "bg-[#F8FAFC] text-blue-600", icon: <LibraryBig className="w-5.5 h-5.5" /> },
                          { tag: "Tasbih", action: () => { setActiveTab("tasbih"); addToast("Tasbih Digital", "Membuka fitur Tasbih Digital.", "info"); }, bg: "bg-[#EDF5F1] text-emerald-700", icon: <RotateCcw className="w-5.5 h-5.5" /> },
                          { tag: "Hadits", action: () => { setActiveTab("hadits"); addToast("Kumpulan Hadits", "Membuka perpustakaan hadits.", "info"); }, bg: "bg-[#F0F7FF] text-blue-700", icon: <Scroll className="w-5.5 h-5.5" /> },
                          { tag: "Fikih", action: () => { setActiveTab("fikih"); addToast("Fikih", "Membuka panduan beribadah.", "info"); }, bg: "bg-[#FDF2F8] text-pink-700", icon: <BookMarked className="w-5.5 h-5.5" /> },
                          { tag: "Lainnya", action: () => setSubMenuLevel(2), bg: "bg-[#F5F5F5] text-slate-700", icon: <LayoutGrid className="w-5.5 h-5.5" /> },
                        ],
                        2: [
                          { tag: "Kembali", action: () => setSubMenuLevel(1), bg: "bg-[#F5F5F5] text-slate-500", icon: <ArrowLeft className="w-5.5 h-5.5" /> },
                          { tag: "Cari", action: () => { setActiveTab("cari"); addToast("Pencarian", "Membuka fitur pencarian.", "info"); }, bg: "bg-[#FFF6ED] text-orange-600", icon: <Search className="w-5.5 h-5.5 text-orange-600" /> },
                          { tag: "Asmaul Husna", action: () => setActiveTab("asmaulHusna"), bg: "bg-[#F3EEF8] text-purple-700", icon: <Star className="w-5.5 h-5.5" /> },
                          { tag: "Kisah Nabi", action: () => setActiveTab("kisahNabi"), bg: "bg-[#FDF2EB] text-amber-800", icon: <Users className="w-5.5 h-5.5" /> },
                          { tag: "Waris", action: () => setActiveTab("waris"), bg: "bg-[#EEF6FA] text-slate-700", icon: <Calculator className="w-5.5 h-5.5" /> },
                          { tag: "Radio", action: () => setActiveTab("radio"), bg: "bg-[#F0FDF4] text-emerald-600", icon: <Radio className="w-5.5 h-5.5" /> },
                          { tag: "Khutbah", action: () => setActiveTab("khutbah"), bg: "bg-[#F8FAFC] text-blue-600", icon: <Mic className="w-5.5 h-5.5" /> },
                          { tag: "Lainnya", action: () => setSubMenuLevel(3), bg: "bg-[#F5F5F5] text-slate-700", icon: <LayoutGrid className="w-5.5 h-5.5" /> },
                        ],
                        3: [
                          { tag: "Kembali", action: () => setSubMenuLevel(2), bg: "bg-[#F5F5F5] text-slate-500", icon: <ArrowLeft className="w-5.5 h-5.5" /> },
                          { tag: "Tadarus", action: () => setActiveTab("tadarus"), bg: "bg-[#F3EEF8] text-purple-700", icon: <BookOpen className="w-5.5 h-5.5" /> },
                          { tag: "Shalawat", action: () => setActiveTab("shalawat"), bg: "bg-[#FFFCE8] text-pink-600", icon: <Quote className="w-5.5 h-5.5" /> },
                          { tag: "Tanya Ustadz", action: () => setActiveTab("ustadz"), bg: "bg-[#EEF6FA] text-teal-700", icon: <MessageCircle className="w-5.5 h-5.5" /> },
                        ]
                      };

                      const currentMenu = menus[subMenuLevel as keyof typeof menus] || menus[0];

                      return currentMenu.map((itm, i) => (
                        <button
                          key={i}
                          onClick={itm.action}
                          className="flex flex-col items-center text-center gap-2 cursor-pointer focus:outline-none"
                        >
                          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#FAF6EE] border border-[#F2ECE4]/60 shadow-xs flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                            <div className={`p-1 ${(itm.bg || "").split(" ")[1] || ""}`}>
                              {itm.icon}
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-normal line-clamp-1 w-full mt-0.5">
                            {itm.tag}
                          </span>
                        </button>
                      ));
                    })()}
                  </motion.div>
                </AnimatePresence>
            </div>

            {/* Target Membaca Harian */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Target Harian
                    </h4>
                    <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                      {dailyReadingTime} dari 15 Menit hari ini
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updateDailyReadingTime(5)}
                  disabled={dailyReadingTime >= 15}
                  className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    dailyReadingTime >= 15
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-[#0F4C3A]/10 text-[#0F4C3A] hover:bg-[#0F4C3A]/20 active:scale-95 cursor-pointer"
                  }`}
                >
                  {dailyReadingTime >= 15 ? "Selesai" : "+ 5 Menit"}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min((dailyReadingTime / 15) * 100, 100)}%`,
                    }}
                    className="h-full bg-[#ECC17A] rounded-full transition-all duration-500 ease-out"
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {Math.round(Math.min((dailyReadingTime / 15) * 100, 100))}%
                </span>
              </div>
            </div>

            {/* Progress Tilawah */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-855 tracking-wide">
                  Progress Tilawah
                </h4>
                <button
                  onClick={() =>
                    handleJumpToSurah(
                      tilawahProgress.currentSurah,
                      tilawahProgress.currentAyat,
                    )
                  }
                  className="text-xs font-bold text-[#0F4C3A] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Lihat Semua
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-[#EDF5F1] rounded-3xl p-5 sm:p-6 shadow-xs border border-emerald-100/40 flex items-center gap-5 justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-850 truncate">
                    {tilawahProgress.currentSurahName} ·{" "}
                    {tilawahProgress.currentSurah}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Ayat {tilawahProgress.currentAyat} dari{" "}
                    {tilawahProgress.totalAyat}
                  </p>

                  {/* Progress bar and 64% inline */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 bg-emerald-800/10 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${tilawahProgress.progressPercentage}%`,
                        }}
                        className="h-full bg-[#0F4C3A] rounded-full transition-all duration-300"
                      ></div>
                    </div>
                    <span className="font-extrabold text-xs text-slate-600 font-mono">
                      {tilawahProgress.progressPercentage}%
                    </span>
                  </div>
                </div>

                {/* Big circular green badge on the right with a gold open book icon! */}
                <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-[#0F4C3A] flex items-center justify-center text-center flex-shrink-0 shadow shadow-emerald-950/30">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full border border-[#ECC17A]/30 flex items-center justify-center bg-emerald-900/40">
                    <BookOpen className="w-5.5 h-5.5 text-[#ECC17A]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Terakhir Dibaca directory list (from image) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-855 tracking-wide">
                  Terakhir Dibaca
                </h4>
                <button
                  onClick={() => setActiveTab("quran")}
                  className="text-xs font-bold text-[#0F4C3A] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Lihat Semua
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col">
                {[
                  { name: "Al-Kahf", num: 18, details: "Halaman 293" },
                  { name: "Yasin", num: 36, details: "Halaman 440" },
                  { name: "Ar-Rahman", num: 55, details: "Halaman 531" },
                ].map((itm, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleJumpToSurah(itm.num)}
                    className={`w-full text-left py-3 hover:bg-slate-50/50 transition-all flex justify-between items-center group cursor-pointer ${
                      idx !== 2 ? "border-b border-slate-100/70" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Premium elegant rounded square widget with mosque dome ornament */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden ${
                          idx === 0
                            ? "bg-[#0F4C3A]/10 text-[#0F4C3A]"
                            : idx === 1
                              ? "bg-amber-100/70 text-amber-800"
                              : "bg-[#EDF5F1] text-emerald-800"
                        }`}
                      >
                        <svg
                          className="absolute inset-0 opacity-15"
                          viewBox="0 0 40 40"
                          fill="currentColor"
                        >
                          <path d="M 20 6 L 33 24 Q 20 18 7 24 Z" />
                          <circle cx="20" cy="29" r="3.5" />
                        </svg>
                        <span className="font-serif font-bold text-sm select-none z-10">
                          📖
                        </span>
                      </div>
                      <span className="font-bold text-slate-700 text-sm group-hover:text-[#0F4C3A] transition-colors">
                        {itm.name} · {itm.num}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 font-bold text-xs group-hover:text-[#0F4C3A] transition-colors">
                      {itm.details}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Realtime prayer schedule display */}
            <div id="jadwal-sholat-widget-container">
              <JadwalSholatWidget addToast={addToast} />
            </div>

            {/* Target Khatam Planner */}
            <div id="target-khatam-widget-container">
              <TargetKhatamWidget 
                addToast={addToast} 
                onNavigateToQuran={() => setActiveTab("quran")}
              />
            </div>
          </div>
        );

      case "quran":
        return (
          <QuranReader
            bookmarks={bookmarks}
            addBookmark={handleAddBookmark}
            removeBookmark={handleRemoveBookmark}
            notes={notes}
            addNote={handleAddNote}
            deleteNote={handleDeleteNote}
            updateTilawahProgress={handleUpdateTilawahProgress}
            addToast={addToast}
            initialSelectedSurah={deepLinkSurah}
            initialSelectedAyat={deepLinkAyat}
            resetInitialSelectedSurah={() => {
              setDeepLinkSurah(null);
              setDeepLinkAyat(null);
            }}
          />
        );

      case "doa":
        return <DoaHarianView addToast={addToast} />;

      case "cari":
        return (
          <CariView
            onSelectSurah={handleJumpToSurah}
            addToast={addToast}
          />
        );

      case "tasbih":
        return (
          <TasbihView
            addToast={addToast}
            onBack={() => setActiveTab("beranda")}
          />
        );

      case "kiblat":
        return (
          <ArahKiblatView
            addToast={addToast}
            onBack={() => setActiveTab("beranda")}
          />
        );

      case "kalender":
        return (
          <KalenderView
            addToast={addToast}
            onBack={() => setActiveTab("beranda")}
          />
        );

      case "tafsir":
        return (
          <TafsirView
            addToast={addToast}
            onBack={() => setActiveTab("beranda")}
          />
        );

      case "hadits":
        return (
          <HaditsView
            addToast={addToast}
            onBack={() => setActiveTab("beranda")}
          />
        );

      case "fikih":
        return <FikihView onBack={() => setActiveTab("beranda")} />;

      case "jurnal":
        return <JurnalIbadahView onBack={() => setActiveTab("beranda")} />;

      case "dzikir":
        return (
          <DzikirPagiPetangView 
            addToast={addToast}
            onBack={() => setActiveTab("beranda")} 
          />
        );

      case "zakat":
        return <KalkulatorZakatView onBack={() => setActiveTab("beranda")} />;

      case "ustadz":
        return (
          <TanyaUstadzView
            onBack={() => setActiveTab("beranda")}
            addToast={addToast}
            geminiApiKey={geminiApiKey}
            onNavigateToSurahAyah={(surah, ayat) => {
              setDeepLinkSurah(surah);
              setDeepLinkAyat(ayat);
              setActiveTab("quran");
            }}
          />
        );

      case "asmaulHusna":
        return <AsmaulHusnaView onBack={() => setActiveTab("beranda")} addToast={addToast} />;
      case "kisahNabi":
        return <KisahNabiView onBack={() => setActiveTab("beranda")} />;
      case "waris":
        return <KalkulatorWarisView onBack={() => setActiveTab("beranda")} addToast={addToast} />;
      case "radio":
        return <RadioIslamView onBack={() => setActiveTab("beranda")} addToast={addToast} />;
      case "khutbah":
        return <KhutbahJumatView onBack={() => setActiveTab("beranda")} />;
      case "shalawat":
        return <KumpulanShalawatView onBack={() => setActiveTab("beranda")} addToast={addToast} />;
      case "tadarus":
        return <TadarusView onBack={() => setActiveTab("beranda")} addToast={addToast} />;

      case "profil":
        return (
          <SettingsView
            bookmarks={bookmarks}
            removeBookmark={handleRemoveBookmark}
            notes={notes}
            deleteNote={handleDeleteNote}
            onJumpToSurah={handleJumpToSurah}
            userName={userName}
            setUserName={handleSetUserName}
            dailyGoalMinutes={dailyGoalMinutes}
            setDailyGoalMinutes={handleSetDailyGoalMinutes}
            geminiApiKey={geminiApiKey}
            setGeminiApiKey={handleSetGeminiApiKey}
            isNightMode={isNightMode}
            setIsNightMode={setIsNightMode}
            addToast={addToast}
          />
        );

      default:
        return null;
    }
  };

  // Skip visual splash screen instantly on completion loading
  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="relative min-h-screen bg-[#FDFBF7] text-slate-800 font-sans pb-[120px] md:pb-[140px] flex flex-col justify-between overflow-x-hidden">
      {/* Toast container notification tray */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* 1. TOP COVER DECORATION & COHESIVE SYSTEM HEADERS */}
      {activeTab === "beranda" ? (
        <div className="relative w-full text-white">
          <div className="absolute top-0 inset-x-0 h-[50vh] sm:h-[55vh] min-h-[400px] z-0 pointer-events-none overflow-hidden bg-slate-800 keep-color">
            <motion.div
              animate={{ scale: [1, 1.08] }}
              transition={{
                duration: 40,
                ease: "linear",
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="w-full h-full opacity-90 origin-bottom"
              style={{
                backgroundImage: `url(/${timeOfDay}.png)`,
                backgroundSize: "cover",
                backgroundPosition: "center bottom",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          </div>

          <div className="relative z-10 pt-12 pb-[180px] sm:pb-[220px] px-5 max-w-2xl lg:max-w-4xl mx-auto w-full drop-shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col drop-shadow-md">
                <span className="text-sm font-medium tracking-wide">
                  Assalamualaikum 👋
                </span>
                <h1 className="font-serif font-bold text-white text-3xl sm:text-4xl mt-0.5 tracking-tight leading-tight">
                  Selamat datang!
                </h1>
                <p className="text-xs font-medium mt-1">
                  Semoga hari ini penuh berkah.
                </p>
              </div>

              {/* Notification bell button */}
              <div className="flex gap-2 flex-shrink-0 self-start mt-2">
                <button
                  onClick={() => {
                    setActiveTab("profil");
                    addToast(
                      "Setelan Pengingat",
                      "Silakan atur preferences profil & alarm sholat Anda.",
                      "info",
                    );
                  }}
                  className="w-11 h-11 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 cursor-pointer shadow-sm relative focus:outline-none transition-transform active:scale-95"
                >
                  <Bell className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* GLOBAL HEADER FOR PRIMARY TABS */}
      {["quran", "doa", "cari", "profil"].includes(activeTab) && subMenuLevel === 0 ? (
        <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-30 px-5 py-4 flex items-center justify-center">
          <h2 className="font-serif font-bold text-lg text-[#0F4C3A]">
            {activeTab === "quran" && "Mushaf Al-Qur'an"}
            {activeTab === "doa" && "Kumpulan Doa Harian"}
            {activeTab === "cari" && "Pencarian & AI"}
            {activeTab === "profil" && "Profil Pengaturan"}
          </h2>
        </div>
      ) : null}

      {/* 2. DYNAMIC WORK SPACE */}
      <main
        className={`flex-1 w-full mx-auto relative z-10 
        ${
          activeTab === "beranda"
            ? "bg-[#FDFBF7] rounded-t-[40px] sm:rounded-t-[48px] pt-6 px-5 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]"
            : ["quran", "doa", "cari", "profil"].includes(activeTab)
              ? "px-5 py-6 sm:py-8 max-w-7xl"
              : "w-full h-full"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
            className="w-full h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <InstallPrompt />

      {/* 3. PREMIUM FLOATING BOTTOM NAVIGATION BAR */}
      <motion.nav
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1], delay: 0.1 }}
        className="fixed bottom-0 md:bottom-6 inset-x-0 bg-white/95 backdrop-blur-md border-t md:border border-slate-100 rounded-t-[32px] md:rounded-[32px] px-6 sm:px-10 py-2 pb-6 md:pb-2 flex justify-between items-end shadow-2xl shadow-slate-900/10 z-40 w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto transition-all"
      >
        {[
          {
            id: "beranda",
            label: "Beranda",
            icon: <Home className="w-[22px] h-[22px]" strokeWidth={1.5} />,
          },
          {
            id: "quran",
            label: "Al-Qur'an",
            icon: <BookOpen className="w-[22px] h-[22px]" strokeWidth={1.5} />,
          },
          {
            id: "ustadz",
            label: "Tanya AI",
            icon: <Bot className="w-6 h-6" strokeWidth={1.5} />,
            isCenter: true,
          },
          {
            id: "doa",
            label: "Doa",
            icon: <HandHeart className="w-[22px] h-[22px]" strokeWidth={1.5} />,
          },
          {
            id: "profil",
            label: "Profil",
            icon: <User className="w-[22px] h-[22px]" strokeWidth={1.5} />,
          },
        ].map((item) => {
          const isAct = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab("ustadz")}
                className="flex flex-col items-center justify-center flex-1 focus:outline-none cursor-pointer group pb-1"
              >
                <div className="relative -top-6 w-14 h-14 rounded-full bg-[#0F4C3A] text-white flex items-center justify-center shadow-lg shadow-emerald-950/30 transition-transform active:scale-95 hover:scale-105 border-4 border-white">
                  {item.icon}
                </div>
                <span
                  className={`text-[10px] font-bold tracking-tight -mt-4 mb-0.5 transition-colors duration-300 ${
                    isAct
                      ? "text-[#0F4C3A]"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className="relative flex flex-col items-center justify-center p-2 cursor-pointer focus:outline-none group select-none flex-1 pb-1.5"
            >
              {isAct && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute inset-0 bg-[#0F4C3A]/10 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div
                className={`relative z-10 transition-all duration-500 ease-out ${
                  isAct
                    ? "text-[#0F4C3A] scale-110 drop-shadow-md translate-y-[-2px]"
                    : "text-slate-400 group-hover:text-slate-700 group-hover:-translate-y-1"
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`relative z-10 text-[10px] font-bold tracking-tight mt-1 transition-colors duration-500 ${
                  isAct
                    ? "text-[#0F4C3A]"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}
