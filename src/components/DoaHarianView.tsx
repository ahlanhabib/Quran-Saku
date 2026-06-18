/**
 * @author Habib Ismail Al Qadri
 * @app Quran Saku
 */
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Search,
  Share2,
  Copy,
  Trash,
  RotateCw,
  Sparkles,
  Check,
  ChevronDown,
  HandHelping,
  Plus,
  AlertCircle,
  Compass,
  Volume2,
  VolumeX,
  Smartphone,
  History,
  Eye,
  Info,
} from "lucide-react";
import { STATIC_DOA, ASMAUL_HUSNA } from "../data";
import { DoaItem } from "../types";

interface DoaHarianViewProps {
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
}

export const DoaHarianView: React.FC<DoaHarianViewProps> = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState<
    "doa" | "tasbih" | "asmaul" | "kiblat"
  >("doa");

  // Doa state
  const [doas, setDoas] = useState<DoaItem[]>(STATIC_DOA);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDoa, setExpandedDoa] = useState<string | null>(null);

  // Tasbih state
  const [dhikrCount, setDhikrCount] = useState(0);
  const [dhikrTarget, setDhikrTarget] = useState(33);
  const [dhikrPhrase, setDhikrPhrase] = useState("Subhanallah");
  const [dhikrTotalCompleted, setDhikrTotalCompleted] = useState(0);
  const [customDhikr, setCustomDhikr] = useState("");
  const [isCustomDhikrActive, setIsCustomDhikrActive] = useState(false);

  // New tasbih feature variables
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isVibrateOn, setIsVibrateOn] = useState(true);
  const [tasbihLogs, setTasbihLogs] = useState<
    { phrase: string; count: number; date: string }[]
  >(() => {
    const raw = localStorage.getItem("myquran_tasbih_logs");
    return raw ? JSON.parse(raw) : [];
  });

  // Asmaul Husna state
  const [asmaulQuery, setAsmaulQuery] = useState("");
  const [selectedAsma, setSelectedAsma] = useState<
    (typeof ASMAUL_HUSNA)[0] | null
  >(null);

  // Kiblat state
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [manualHeading, setManualHeading] = useState(135); // simulated manual slider angle for preview environment
  const [supportsSensor, setSupportsSensor] = useState(false);

  // Trigger web vibration
  const triggerVibrate = (ms: number) => {
    if (isVibrateOn && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Sound generator
  const triggerSound = (pitch = 440, duration = 0.08) => {
    if (!isSoundOn) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  };

  // Sensor reading for compass
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // absolute heading or alpha depending on browser support
      const heading = (e as any).webkitCompassHeading || 360 - (e.alpha || 0);
      if (typeof heading === "number") {
        setDeviceHeading(Math.round(heading));
        setSupportsSensor(true);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Sync logs back to localstorage
  useEffect(() => {
    localStorage.setItem("myquran_tasbih_logs", JSON.stringify(tasbihLogs));
  }, [tasbihLogs]);

  // Handle Increments
  const handleTasbihTap = () => {
    const nextCount = dhikrCount + 1;
    triggerVibrate(35);

    if (nextCount > dhikrTarget) {
      // target reached
      const timeString = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const completedItem = {
        phrase: dhikrPhrase,
        count: dhikrTarget,
        date: timeString,
      };

      setTasbihLogs((prev) => [completedItem, ...prev].slice(0, 10)); // keep last 10 logs
      setDhikrCount(1);
      setDhikrTotalCompleted((prev) => prev + 1);
      triggerSound(880, 0.4); // Congratulations high tone

      addToast(
        "Dzikir Selesai! 🎉",
        `Alhamdulillah, Anda menyelesaikan ${dhikrTarget} kali dzikir: ${dhikrPhrase}`,
        "success",
      );
    } else {
      setDhikrCount(nextCount);
      // Play a direct tactile click tone
      triggerSound(nextCount === dhikrTarget ? 660 : 440, 0.1);

      if (nextCount === dhikrTarget) {
        triggerVibrate(150); // longer vibration at accomplishment
        addToast(
          "Putaran Selesai 📿",
          `Alhamdulillah, melampaui ke ${dhikrPhrase} target ${dhikrTarget} kali.`,
          "info",
        );
      }
    }
  };

  const handleTasbihReset = () => {
    setDhikrCount(0);
    triggerSound(220, 0.25);
    addToast(
      "Dzikir Direset",
      "Alat tasbih digital kembali diatur ke nol.",
      "info",
    );
  };

  const deleteSingleLog = (index: number) => {
    setTasbihLogs((prev) => prev.filter((_, i) => i !== index));
    addToast(
      "Catatan Dihapus",
      "Log tasbih lokal berhasil dibersihkan.",
      "warning",
    );
  };

  const categories = ["Semua", "Penting", "Harian", "Keluarga", "Ibadah"];

  const filteredDoas = doas.filter((doa) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      doa.judul.toLowerCase().includes(query) ||
      doa.terjemah.toLowerCase().includes(query) ||
      doa.latin.toLowerCase().includes(query);
    const matchesCategory =
      selectedCategory === "Semua" || doa.kategori === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  // Filter 99 Names of Allah Swt
  const filteredAsmaul = ASMAUL_HUSNA.filter((item) => {
    const query = asmaulQuery.toLowerCase();
    return (
      item.latin.toLowerCase().includes(query) ||
      item.arti.toLowerCase().includes(query) ||
      item.no.toString().includes(query)
    );
  });

  // copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(
      "Berhasil Disalin",
      `Teks ${label} siap dibagikan ke sanak keluarga.`,
      "success",
    );
  };

  // Share helper
  const handleShare = (doa: DoaItem) => {
    const shareText = `*${doa.judul}*\n\n${doa.arab}\n\n_Latin:_ ${doa.latin}\n\n_Artinya:_ "${doa.terjemah}"\n\n(Dikutip dari: ${doa.sumber || "MyQuran Digital"})`;
    if (navigator.share) {
      navigator
        .share({
          title: doa.judul,
          text: shareText,
        })
        .catch(() => {});
    } else {
      handleCopy(shareText, "Pesan lengkap doa");
    }
  };

  // Get active orientation target details
  const activeCompassHeading = supportsSensor ? deviceHeading : manualHeading;

  // Indonesia Standard Kiblat Angle is ~295° relative to North
  const targetKiblatAngle = 295;
  const isAligned = Math.abs(activeCompassHeading - targetKiblatAngle) <= 6;

  return (
    <div className="flex flex-col gap-5">
      {/* Tab Selectors Segment */}
      <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-none">
        {[
          {
            tabId: "doa",
            name: "Doa Pilihan",
            icon: <HandHelping className="w-4 h-4" />,
          },
          {
            tabId: "asmaul",
            name: "Asmaul Husna",
            icon: <Sparkles className="w-4 h-4" />,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.tabId;
          return (
            <button
              key={tab.tabId}
              onClick={() => {
                setActiveTab(tab.tabId as any);
                setSearchQuery("");
                setAsmaulQuery("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white text-[#0F4C3A] shadow-md shadow-emerald-950/5"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="hidden xs:inline-block flex-shrink-0">
                {tab.icon}
              </span>
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE SCREEN TAB */}

      {/* 1. DOA TAB */}
      {activeTab === "doa" && (
        <div className="flex flex-col gap-4">
          {/* Quick Header */}
          <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
            <h3 className="font-serif font-bold text-slate-800 text-base">
              Kumpulan Doa Pilihan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Temukan tuntunan berserah diri kepada Allah Swt dalam keseharian
              Anda.
            </p>
          </div>

          {/* Categorized Pill filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSel
                      ? "bg-[#0F4C3A] text-white shadow-sm"
                      : "bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Quick search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Judul Doa atau Artinya..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          </div>

          {/* Feed of doas */}
          <div className="flex flex-col gap-3">
            {filteredDoas.length > 0 ? (
              filteredDoas.map((doa, index) => {
                const isExpanded = expandedDoa === doa.judul;
                return (
                  <div
                    key={index}
                    className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Header trigger click area */}
                    <div
                      onClick={() =>
                        setExpandedDoa(isExpanded ? null : doa.judul)
                      }
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex gap-3 items-center min-w-0 pr-4">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0 animate-pulse"></span>
                        <h4 className="font-bold text-slate-700 text-xs sm:text-sm truncate">
                          {doa.judul}
                        </h4>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>

                    {/* Expose details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-slate-50/20 border-t border-slate-50"
                        >
                          <div className="p-4 flex flex-col gap-4">
                            {/* Arabic script */}
                            <p className="text-right font-serif text-2xl leading-[1.8] text-slate-800 select-all max-w-full italic">
                              {doa.arab}
                            </p>

                            {/* Latin and translation block */}
                            <div className="flex flex-col gap-2 mt-2">
                              <p className="text-[#0F4C3A] text-xs font-semibold leading-relaxed">
                                {doa.latin}
                              </p>
                              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                                {doa.terjemah}
                              </p>
                            </div>

                            {/* Source and share tools */}
                            <div className="flex justify-between items-center border-t border-slate-50 pt-3.5 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                                SUMBER:{" "}
                                {doa.sumber?.toUpperCase() || "HADITS PILIHAN"}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleCopy(doa.arab, "Teks Arab")
                                  }
                                  className="p-1 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Kopi Arab
                                </button>
                                <button
                                  onClick={() => handleShare(doa)}
                                  className="p-1 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#0F4C3A] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  Bagikan Doa
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-medium">
                  Doa tidak ditemukan. Coba pencarian kata kunci lainnya.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TASBIH DIGITAL TAB */}
      {activeTab === "tasbih" && (
        <div className="flex flex-col items-center gap-6">
          {/* Quick instructions and loop tracker details */}
          <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="font-serif font-bold text-slate-850 text-sm">
                Kemajuan Tasbih
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Putaran selesai hari ini:{" "}
                <strong className="text-emerald-700">
                  {dhikrTotalCompleted} putaran
                </strong>
              </p>
            </div>

            {/* Audio tactile settings toggler */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSoundOn(!isSoundOn)}
                title={isSoundOn ? "Matikan Bunyi" : "Nyalakan Bunyi"}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${isSoundOn ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}
              >
                {isSoundOn ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsVibrateOn(!isVibrateOn)}
                title={isVibrateOn ? "Matikan Vibrasi" : "Nyalakan Vibrasi"}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${isVibrateOn ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}
              >
                <Smartphone className="w-4 h-4 opacity-75" />
              </button>
              <button
                onClick={handleTasbihReset}
                className="px-3 py-1.5 bg-white border border-red-100 hover:bg-red-50 text-red-505 text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer text-red-650"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Dzikr selections rows */}
          <div className="w-full flex flex-col gap-2.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider">
              PILIH BACAAN DZIKIR
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Subhanallah", "Alhamdulillah", "Allahu Akbar"].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setDhikrPhrase(p);
                    setIsCustomDhikrActive(false);
                    setDhikrCount(0);
                    addToast(
                      "Kalimat Terpilih",
                      `Memulai dzikir dengan lafal: ${p}`,
                      "info",
                    );
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    dhikrPhrase === p && !isCustomDhikrActive
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
                      : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Target cycles selects */}
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 tracking-wider">
                  TARGET PUTARAN
                </label>
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {[33, 99].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setDhikrTarget(t);
                        setDhikrCount(0);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dhikrTarget === t
                          ? "bg-white text-emerald-800 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      {t} Kali
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom sentence field */}
              <div className="flex flex-col gap-1 justify-end">
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={customDhikr}
                    onChange={(e) => setCustomDhikr(e.target.value)}
                    placeholder="Kalimat Kustom..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!customDhikr.trim()) return;
                      setDhikrPhrase(customDhikr);
                      setIsCustomDhikrActive(true);
                      setDhikrCount(0);
                      addToast(
                        "Lafadz Kustom",
                        `Mengaktifkan dzikir kalimat pilihan Anda.`,
                        "success",
                      );
                    }}
                    className="p-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-2"></div>

          {/* HUGE CIRCULAR TRIGGER BUTTON */}
          <div className="relative flex items-center justify-center select-none">
            {/* Outer dynamic border spinner circle matching target progress */}
            <svg className="w-52 h-52 sm:w-56 sm:h-56 transform -rotate-90">
              <circle
                cx="104"
                cy="104"
                r="88"
                className="stroke-slate-100 fill-none"
                strokeWidth="10"
                style={{ cx: "50%", cy: "50%" }}
              />
              <circle
                cx="104"
                cy="104"
                r="88"
                className="stroke-emerald-600 fill-none transition-all duration-150"
                strokeWidth="10"
                strokeLinecap="round"
                style={{ cx: "50%", cy: "50%" }}
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={
                  2 * Math.PI * 88 * (1 - dhikrCount / dhikrTarget)
                }
              />
            </svg>

            {/* Actual clickable core button with scale animation on tapped */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleTasbihTap}
              className="absolute w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-[#0F4C3A] to-emerald-950 border-4 border-amber-300/30 flex flex-col justify-center items-center text-center p-4 shadow-xl shadow-emerald-950/20 cursor-pointer focus:outline-none select-none"
            >
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 tracking-wider uppercase truncate max-w-full px-2">
                {dhikrPhrase}
              </span>
              <span className="font-mono text-4xl sm:text-5xl font-bold text-white my-2.5 drop-shadow">
                {dhikrCount}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#ECC17A] tracking-wider uppercase bg-white/10 px-2.5 py-0.5 rounded-full">
                SISA: {dhikrTarget - dhikrCount}
              </span>
            </motion.button>
          </div>

          <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold tracking-wide text-center leading-normal">
            KETUK BULATAN ALAT UNTUK MENGHITUNG
            <br />
            {isVibrateOn && "• Getaran aktif •"}{" "}
            {isSoundOn && "• Nada klik bersuara •"}
          </p>

          {/* Dzikir completion history log (MyQuran dynamic standard) */}
          <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 shadow-sm mt-2">
            <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider mb-3">
              <History className="w-4 h-4 text-emerald-700" /> Riyawat Dzikir
              Terbaru
            </h4>

            {tasbihLogs.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {tasbihLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-700">
                        {log.phrase}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-2 font-medium">
                        {log.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-bold font-mono text-[11px]">
                        +{log.count} kali
                      </span>
                      <button
                        onClick={() => deleteSingleLog(idx)}
                        className="text-slate-300 hover:text-red-500 font-bold px-1.5 cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">
                Belum ada riwayat dzikir terselesaikan hari ini.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. ASMAUL HUSNA TAB */}
      {activeTab === "asmaul" && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-[#0F4C3A] text-base">
                Asmaul Husna
              </h3>
              <p className="text-xs text-slate-505 mt-1 text-slate-500">
                Merenungi 99 nama-nama baik Allah Swt pembuka jalan kebaikan dan
                mukjizat kemuliaan.
              </p>
            </div>
            <span className="self-start xs:self-center font-bold font-mono text-emerald-800 text-xs bg-emerald-100 px-3 py-1 rounded-full whitespace-nowrap">
              {filteredAsmaul.length} Nama Cocok
            </span>
          </div>

          {/* Quick interactive search filter for all 99 names */}
          <div className="relative">
            <input
              type="text"
              value={asmaulQuery}
              onChange={(e) => setAsmaulQuery(e.target.value)}
              placeholder="Cari lafadz nama Allah Swt (e.g. Al-Malik, Penyayang)..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          </div>

          {/* List layout of names */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredAsmaul.map((itm) => (
              <motion.div
                key={itm.no}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedAsma(itm)}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/20 transition-all gap-1 relative overflow-hidden group min-h-[120px]"
              >
                {/* Visual Gold corner badges */}
                <span className="absolute top-2 left-2.5 text-[8px] font-bold text-slate-350 bg-slate-105 px-1.5 py-0.5 rounded font-mono">
                  #{itm.no}
                </span>

                <span className="font-serif text-2xl font-bold text-slate-800 group-hover:text-[#0F4C3A] mt-2 tracking-wide leading-none select-none">
                  {itm.arab}
                </span>
                <span className="text-xs font-bold text-slate-700 mt-2 truncate w-full">
                  {itm.latin}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-tight leading-normal line-clamp-1">
                  {itm.arti}
                </span>

                <span className="text-[9px] text-emerald-600 font-extrabold mt-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info className="w-3 h-3" /> Pelajari
                </span>
              </motion.div>
            ))}

            {filteredAsmaul.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Tidak ada nama asmaul husna yang cocok dengan pencarian Anda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. COMPASS QIBLA FINDER COMPONENT */}
      {activeTab === "kiblat" && (
        <div className="flex flex-col items-center gap-5">
          <div className="w-full bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
            <h3 className="font-serif font-bold text-slate-800 text-sm">
              Kompas Arah Kiblat
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Membantu menentukan jalur hadapan kiblat mengarah langsung ke
              Ka'bah di Makkah Al-Mukarramah (~295° WIB).
            </p>
          </div>

          {/* Compass layout stage */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-full border border-slate-200/60 shadow p-6 flex items-center justify-center select-none overflow-hidden">
            {/* Visual background rings */}
            <div className="absolute inset-4 rounded-full border border-slate-200 border-dashed"></div>
            <div className="absolute inset-16 rounded-full border border-[#0F4C3A]/5"></div>

            {/* Rotating dial based on heading */}
            <motion.div
              animate={{ rotate: -activeCompassHeading }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              className="absolute w-full h-full p-6 flex items-center justify-center"
            >
              {/* Scale Tick Markers */}
              <div className="relative w-full h-full flex items-center justify-center font-bold text-[10px] text-slate-400">
                <span className="absolute top-2 text-[#0F4C3A] font-extrabold">
                  U
                </span>
                <span className="absolute right-2">T</span>
                <span className="absolute bottom-2">S</span>
                <span className="absolute left-2">B</span>

                {/* Sub markers */}
                <span className="absolute top-10 right-10 text-[8px] opacity-50">
                  TL
                </span>
                <span className="absolute bottom-10 right-10 text-[8px] opacity-50">
                  TG
                </span>
                <span className="absolute bottom-10 left-10 text-[8px] opacity-50">
                  BD
                </span>
                <span className="absolute top-10 left-10 text-[8px] opacity-50">
                  BL
                </span>

                {/* Compass Circle graphic details */}
                <div className="w-44 h-44 rounded-full border-2 border-slate-200/55 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border border-slate-100 bg-white/20"></div>
                </div>

                {/* Absolute Qibla Mark inside the rotating circle (at 295 degrees) */}
                <div
                  className="absolute w-12 h-12 flex items-center justify-center"
                  style={{
                    transform: `rotate(${targetKiblatAngle}deg) translateY(-84px)`,
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    <span className="text-[9px] font-extrabold text-amber-500 bg-[#0F4C3A] px-1.5 py-0.5 rounded-full shadow-sm">
                      KIBLAT
                    </span>
                    <span className="text-sm">🕋</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* STATIC HEADING ARROW (Point straight up for where phone/user looks) */}
            <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center">
              {/* glowing pointer arrow */}
              <div
                className={`w-1 bg-gradient-to-t from-red-600 to-red-500 h-16 rounded-full shadow-lg ${isAligned ? "animate-pulse" : ""}`}
              ></div>
              <div className="w-4 h-4 mt-1 rounded-full border-4 border-slate-800 bg-white shadow z-10"></div>
            </div>

            {/* Compass status badge inside circle */}
            <div className="absolute bottom-12 flex flex-col items-center">
              <span className="text-[11px] font-mono font-extrabold text-slate-700 bg-white border border-slate-200/50 px-2 py-0.5 rounded-lg shadow-sm">
                {activeCompassHeading}°
              </span>
            </div>
          </div>

          {/* Alignment notification banner */}
          <AnimatePresence mode="wait">
            {isAligned ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center max-w-sm flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 animate-bounce">
                  <span className="text-lg">✨</span>
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Arah Kiblat Tepat!
                  </h4>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Segera bersiap mendaratkan sujud ibadah sholat menghadap
                    Ka'bah.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl text-center max-w-sm"
              >
                <p className="text-[11px] text-slate-500 leading-normal">
                  {supportsSensor
                    ? "Putar perangkat gawai Anda perlahan sampai garis penunjuk merah mengarah pas ke tanda Ka'bah 🕋."
                    : "Gunakan kontrol slider di bawah untuk mensimulasikan orientasi perputaran kompas visual secara interaktif:"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive slider control for testing inside the browser simulation if sensor is web locked */}
          {!supportsSensor && (
            <div className="w-full max-w-xs flex flex-col gap-1.5 mt-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>PUTAR COMPASS MANUAL</span>
                <span className="text-emerald-700 font-extrabold">
                  SASARAN: 295°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={manualHeading}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setManualHeading(val);
                  if (Math.abs(val - targetKiblatAngle) <= 6) {
                    triggerVibrate(80);
                    triggerSound(523, 0.15); // aligned chord
                  }
                }}
                className="w-full accent-emerald-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0° (Utara)</span>
                <span>180° (Selatan)</span>
                <span>359°</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ASMAUL HUSNA MODAL DETAILS DIALOG */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedAsma && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom,20px)] sm:p-6 z-[90]">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white rounded-3xl w-full max-w-md max-h-[85dvh] overflow-hidden shadow-2xl flex flex-col p-6 relative mb-4 sm:mb-0"
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedAsma(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-100 rounded-lg text-sm cursor-pointer"
                  >
                    ✕
                  </button>

                  <div className="flex flex-col items-center text-center mt-2">
                    <span className="bg-amber-100 text-[#0F4C3A] font-bold text-xs px-3 py-1 rounded-full font-mono">
                      Nama Allah Ke-{selectedAsma.no}
                    </span>

                    <h3 className="font-serif text-5xl font-bold text-[#0F4C3A] mt-6 select-all">
                      {selectedAsma.arab}
                    </h3>

                    <h4 className="font-extrabold text-slate-800 text-lg mt-4 font-sans tracking-wide">
                      {selectedAsma.latin}
                    </h4>

                    <p className="text-sm font-semibold text-slate-500 mt-1">
                      Artinya:{" "}
                      <span className="text-[#0F4C3A] font-extrabold font-serif italic">
                        "{selectedAsma.arti}"
                      </span>
                    </p>

                    <div className="w-full border-t border-slate-100 my-5 pt-4.5 text-left">
                      <h5 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                        Fadhilah & Pengamalan
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        Mengamalkan atau melantunkan dzikir penuh khusyuk lafadz{" "}
                        <strong className="text-[#0F4C3A]">
                          {selectedAsma.latin}
                        </strong>{" "}
                        secara istiqamah akan membawa ketenangan jiwa,
                        perlindungan rohani, melapangkan rezeki berkah, serta
                        mendekatkan makrifat batin kita ke jalan ketaatan kepada
                        Allah Subhanahu wa Ta'ala.
                      </p>
                    </div>

                    <div className="flex gap-2 w-full mt-2.5">
                      <button
                        onClick={() => {
                          handleCopy(
                            `${selectedAsma.latin} (${selectedAsma.arab}) - Artinya: ${selectedAsma.arti}`,
                            "Nama Allah",
                          );
                        }}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Salin Nama
                      </button>
                      <button
                        onClick={() => setSelectedAsma(null)}
                        className="flex-1 py-2.5 bg-[#0F4C3A] hover:bg-emerald-950 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow"
                      >
                        Tutup Detail
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};
