/**
 * @author Habib Ismail Al Qadri
 * @app Quran Saku
 */
import { PageContainer } from "./PageContainer";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Bookmark,
  Shield,
  Trash,
  Bell,
  Check,
  HelpCircle,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  HeartHandshake,
  Copy,
  Landmark,
  Compass,
} from "lucide-react";
import { Bookmark as BookmarkType, Note } from "../types";

interface SettingsViewProps {
  bookmarks: BookmarkType[];
  removeBookmark: (surahNo: number, ayatNo: number) => void;
  notes: Note[];
  deleteNote: (id: string) => void;
  onJumpToSurah: (surahNo: number) => void;
  userName: string;
  setUserName: (n: string) => void;
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (m: number) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  isNightMode?: boolean;
  setIsNightMode?: (val: boolean) => void;
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  bookmarks,
  removeBookmark,
  notes,
  deleteNote,
  onJumpToSurah,
  userName,
  setUserName,
  dailyGoalMinutes,
  setDailyGoalMinutes,
  geminiApiKey,
  setGeminiApiKey,
  isNightMode,
  setIsNightMode,
  addToast,
}) => {
  const [activeMenu, setActiveMenu] = useState<
    "profil" | "pengingat" | "bookmarks" | "notes" | "support" | "about"
  >("profil");
  const [editingName, setEditingName] = useState(userName);
  const [editingGeminiKey, setEditingGeminiKey] = useState(geminiApiKey);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const [rutinReminders, setRutinReminders] = useState<{
    [key: string]: { enable: boolean; time: string; name: string; days?: number[] };
  }>(() => {
    try {
      const saved = localStorage.getItem("qd_rutinReminders");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new additions are present if using old schema
        const defaultSchema: any = {
          tahajud: { enable: false, time: "03:30", name: "Shalat Tahajud" },
          puasaSeninKamis: { enable: false, time: "03:30", name: "Sahur Puasa Senin-Kamis", days: [1, 4] },
          terbit: { enable: false, time: "05:50", name: "Syuruq / Terbit" },
          dhuha: { enable: false, time: "07:00", name: "Shalat Dhuha" },
          dzikirPagi: { enable: false, time: "06:00", name: "Dzikir Pagi" },
          dzikirPetang: { enable: false, time: "16:00", name: "Dzikir Petang" },
          bacaQuran: { enable: false, time: "20:00", name: "Tadarus Al-Qur'an" },
        };
        return { ...defaultSchema, ...parsed };
      }
    } catch (e) {}
    return {
      tahajud: { enable: false, time: "03:30", name: "Shalat Tahajud" },
      puasaSeninKamis: { enable: false, time: "03:30", name: "Sahur Puasa Senin-Kamis", days: [1, 4] },
      terbit: { enable: false, time: "05:50", name: "Syuruq / Terbit" },
      dhuha: { enable: false, time: "07:00", name: "Shalat Dhuha" },
      dzikirPagi: { enable: false, time: "06:00", name: "Dzikir Pagi" },
      dzikirPetang: { enable: false, time: "16:00", name: "Dzikir Petang" },
      bacaQuran: { enable: false, time: "20:00", name: "Tadarus Al-Qur'an" },
    };
  });

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async (reminders: any) => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        const response = await fetch('/api/push/public-key');
        if (!response.ok) return;
        const data = await response.json();
        const serverPublicKey = urlBase64ToUint8Array(data.publicKey);
        
        if (subscription) {
           const currentKey = subscription.options.applicationServerKey;
           let keyChanged = false;
           if (currentKey) {
             const currentKeyArray = new Uint8Array(currentKey);
             if (currentKeyArray.length !== serverPublicKey.length) {
               keyChanged = true;
             } else {
               for (let i = 0; i < currentKeyArray.length; i++) {
                 if (currentKeyArray[i] !== serverPublicKey[i]) {
                   keyChanged = true;
                   break;
                 }
               }
             }
           } else {
             keyChanged = true;
           }
           
           if (keyChanged) {
              await subscription.unsubscribe();
              subscription = null;
           }
        }

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: serverPublicKey
          });
        }
        
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            rutinReminders: reminders,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
        });
      }
    } catch (error) {
      console.error('Push Subscription Error:', error);
    }
  };

  const saveRutinReminders = async () => {
    localStorage.setItem("qd_rutinReminders", JSON.stringify(rutinReminders));
    addToast(
      "Pengingat Disimpan",
      "Preferensi alarm ibadah rutin telah diperbarui.",
      "success"
    );
    // Request permission if enabled
    let enablePush = false;
    Object.values(rutinReminders).forEach(r => {
      if (r.enable) enablePush = true;
    });

    if (enablePush) {
      if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          const perm = await Notification.requestPermission();
          setNotificationPermission(perm);
        }
        if (Notification.permission === "granted") {
          await subscribeToPush(rutinReminders);
          addToast("Tersinkronisasi", "Notifikasi Push telah aktif dan tersinkron.", "success");
        }
      }
    }
  };

  const saveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(editingName);
    setGeminiApiKey(editingGeminiKey);
    addToast(
      "Profil Disimpan",
      `Pengaturan profil dan API Key telah diperbarui.`,
      "success",
    );
  };

  const clearAllAppletState = () => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus semua data penanda buku, catatan tadabbur, dan info tilawah di dalam Quran Saku?",
      )
    ) {
      localStorage.clear();
      addToast(
        "Data Direset!",
        "Semua data penyimpanan lokal dibersihkan. Memuat ulang...",
        "warning",
      );
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const triggerTestSoundAlert = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // High C
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      addToast(
        "Uji Coba Berhasil 🔊",
        "Getaran audio pengingat adzan disimulasikan.",
        "success",
      );
    } catch {
      addToast(
        "Uji Coba Gagal 🔇",
        "Aktifkan audio untuk mendengar simulasi.",
        "warning",
      );
    }
  };

  const exportDataBackup = () => {
    const data = {
      bookmarks,
      notes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quransaku-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(
      "Berhasil Unduh Data",
      "File cadangan JSON berhasil diunduh ke perangkat Anda.",
      "success",
    );
  };

  return (
    <PageContainer isGrid>
      {/* SIDEBAR NAVIGATION (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-3 bg-white border border-slate-200/60 p-5 rounded-[32px] shadow-sm">
        <div className="p-4 text-center pb-6 border-b border-slate-100 flex flex-col items-center select-none relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/30">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/40 rounded-full blur-2xl"></div>
          <div className="w-20 h-20 rounded-full bg-[#0F4C3A] text-[#ECC17A] font-serif font-extrabold text-3xl flex items-center justify-center border-4 border-white shadow-md mb-4 relative z-10">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <h4 className="font-bold text-slate-800 text-[17px] relative z-10">
            {userName || "Hamba Allah"}
          </h4>
          <span className="text-[10px] text-[#0F4C3A] font-bold tracking-widest mt-2 block bg-white px-4 py-1.5 rounded-full uppercase shadow-sm border border-emerald-100 relative z-10">
            TARGET: {dailyGoalMinutes} MENIT/HARI
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          {[
            {
              id: "profil",
              label: "Profil & Target Harian",
              icon: <User className="w-5 h-5" strokeWidth={1.5} />,
            },
            {
              id: "pengingat",
              label: "Pengingat Ibadah Rutin",
              icon: <Bell className="w-5 h-5" strokeWidth={1.5} />,
            },
            {
              id: "bookmarks",
              label: `Markah Bacaan (${bookmarks.length})`,
              icon: <Bookmark className="w-5 h-5" strokeWidth={1.5} />,
            },
            {
              id: "notes",
              label: `Catatan Tadabbur (${notes.length})`,
              icon: <Shield className="w-5 h-5" strokeWidth={1.5} />,
            },
            {
              id: "support",
              label: "Dukungan / Gift",
              icon: <HeartHandshake className="w-5 h-5" strokeWidth={1.5} />,
            },
            {
              id: "about",
              label: "Tentang Aplikasi",
              icon: <HelpCircle className="w-5 h-5" strokeWidth={1.5} />,
            },
          ].map((item) => {
            const isAct = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as any)}
                className={`w-full text-left px-4 py-3.5 rounded-[20px] text-sm font-bold flex items-center gap-3.5 transition-all cursor-pointer group ${
                  isAct
                    ? "bg-[#0F4C3A] text-white shadow-sm"
                    : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`${isAct ? "text-[#ECC17A]" : "text-slate-400 group-hover:text-[#0F4C3A] transition-colors"}`}
                >
                  {item.icon}
                </div>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT REGION (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200/60 p-6 sm:p-8 rounded-[32px] shadow-sm flex flex-col gap-6 min-h-[400px]">
        {/* VIEW 1: PROFILE MANAGEMENT */}
        {activeMenu === "profil" && (
          <form onSubmit={saveProfileSettings} className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif font-bold text-[#0F4C3A] text-xl">
                Profil Pengguna & Simulasi
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Modifikasi identitas personal dan sasaran ibadah harian.
              </p>
            </div>

            {/* Editing Name field */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Contoh: Ahlan, Muhammad..."
                required
                className="w-full bg-[#FDFBF7] border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm sm:text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] font-bold transition-all shadow-sm"
              />
            </div>

            {/* Goal selecting minutes slider */}
            <div className="flex flex-col gap-3.5 bg-emerald-50/50 border border-emerald-100/50 p-5 rounded-2xl">
              <div className="flex justify-between items-center text-[11px] font-bold text-emerald-800">
                <span className="uppercase tracking-widest text-[#0F4C3A]">
                  TARGET TILAWAH
                </span>
                <span className="text-white bg-[#0F4C3A] px-3 py-1 rounded-full shadow-sm">
                  {dailyGoalMinutes} MENIT / HARI
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full h-1.5 bg-emerald-200/50 rounded-lg appearance-none cursor-pointer accent-[#0F4C3A] mt-2"
              />
              <span className="text-xs text-emerald-700/80 font-medium block leading-relaxed mt-1">
                Sistem tilawah secara berkala memotivasi Anda menyelesaikan
                tadabbur berdasar durasi ini.
              </span>
            </div>

            {/* Editing Gemini API Key field */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                GEMINI API KEY
                <span className="text-[#ECC17A] bg-[#0F4C3A] px-2 py-0.5 rounded-full text-[9px] shadow-sm">
                  OPSIONAL
                </span>
              </label>
              <input
                type="password"
                value={editingGeminiKey}
                onChange={(e) => setEditingGeminiKey(e.target.value)}
                placeholder="Masukkan Gemini API Key..."
                className="w-full bg-[#FDFBF7] border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm sm:text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] font-mono transition-all shadow-sm"
              />
              <span className="text-[11px] text-slate-500 font-medium block leading-relaxed mt-1">
                Digunakan untuk fitur Tanya Ustadz AI. Disimpan di lokal secara
                aman. Dapatkan gratis di{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
                >
                  Google AI Studio
                </a>
                .
              </span>
            </div>

            {/* Night Mode Toggle */}
            {setIsNightMode && (
              <div className="flex justify-between items-center bg-slate-900 border border-slate-700 p-5 rounded-2xl mt-2">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Tema Gelap Membaca
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    "Night Mode" yang nyaman di mata untuk membaca saat malam
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNightMode(!isNightMode)}
                  className={`relative flex items-center w-14 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                    isNightMode ? "bg-[#ECC17A]" : "bg-slate-600"
                  }`}
                >
                  <motion.div
                    layout
                    className={`w-5 h-5 rounded-full shadow-sm bg-white`}
                    style={{
                      transform: isNightMode ? "translateX(28px)" : "translateX(0px)",
                    }}
                  />
                </button>
              </div>
            )}

            {/* Test alert sound mock notification */}
            <div className="border border-emerald-100/60 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-center justify-between bg-emerald-50/50 shadow-sm">
              <div className="text-center sm:text-left flex-1">
                <h4 className="text-sm sm:text-[15px] font-bold text-emerald-900 flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#0F4C3A]" />
                  </div>
                  Uji Coba Alarm Adzan
                </h4>
                <p className="text-xs text-emerald-800/70 font-medium">
                  Tes apakah audio pengingat perangkat Anda siap.
                </p>
              </div>
              <button
                type="button"
                onClick={triggerTestSoundAlert}
                className="w-full sm:w-auto px-5 py-3 bg-[#0F4C3A] hover:bg-emerald-900 text-[#ECC17A] text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                Tes Getar Alarm 🔊
              </button>
            </div>

            <div className="h-2"></div>

            {/* Actions array */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 pt-6 gap-3">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={clearAllAppletState}
                  className="flex-1 sm:flex-none px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-100 transition-colors cursor-pointer"
                >
                  Reset Data
                </button>
                <button
                  type="button"
                  onClick={exportDataBackup}
                  className="flex-1 sm:flex-none px-5 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Export JSON
                </button>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#0F4C3A] to-emerald-900 shadow-md shadow-emerald-900/20 hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}

        {/* VIEW: PENGINGAT RUTIN */}
        {activeMenu === "pengingat" && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif font-bold text-[#0F4C3A] text-xl">
                Pengingat Ibadah Rutin
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Atur alarm pengingat harian untuk kegiatan ibadah Anda.
              </p>
            </div>

            {/* Web Push Status */}
            <div className={`border p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm transition-colors ${
              notificationPermission === 'granted' ? 'bg-emerald-50/50 border-emerald-200' : 
              notificationPermission === 'denied' ? 'bg-red-50/50 border-red-200' : 
              'bg-blue-50/50 border-blue-200'
            }`}>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-bold flex items-center justify-center sm:justify-start gap-2 mb-1">
                  {notificationPermission === 'granted' ? (
                    <><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Push Notifikasi Aktif</>
                  ) : notificationPermission === 'denied' ? (
                    <><span className="w-2 h-2 rounded-full bg-red-500"></span>Notifikasi Diblokir</>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-blue-500"></span>Notifikasi Belum Aktif</>
                  )}
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {notificationPermission === 'granted' 
                    ? 'Pengingat dan Alarm Jadwal Sholat akan dikirim langsung ke perangkat Anda melalui server agar tepat waktu.' 
                    : 'Aktifkan notifikasi browser agar sistem pengingat otomatis berjalan secara background dengan sinkronisasi ke server.'}
                </p>
                {notificationPermission === 'granted' && (
                  <p className="text-[10px] text-slate-500 mt-2 p-2 bg-white/60 rounded-lg border border-slate-200">
                    <strong>Catatan Serverless:</strong> Karena aplikasi versi ini mungkin berjalan di environment <i>Serverless</i> yang "tidur" saat tidak ada trafik web aktif, cron background di server bisa terhenti. Agar notifikasi push server stabil saat PWA ditutup, buat layanan cron eksternal (misal <i>cron-job.org</i>) memanggil endpoint <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 select-all font-mono">/api/push/trigger-cron</code> setiap menit. (Atau gunakan opsi notifikasi lokal di PWA jika eksperimental flag aktif).
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if ("Notification" in window) {
                        const perm = await Notification.requestPermission();
                        setNotificationPermission(perm);
                        if (perm === 'granted') {
                          await subscribeToPush(rutinReminders);
                          addToast("Notifikasi Aktif!", "Izin notifikasi telah diberikan.", "success");
                        } else if (perm === 'denied') {
                          addToast("Peringatan", "Akses diblokir. Harap ubah di pengaturan Browser Anda.", "warning");
                        }
                      }
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-[#0F4C3A] text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Minta Izin Ulang
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (notificationPermission === 'granted') {
                      await subscribeToPush(rutinReminders);
                      addToast("Sinkronisasi Selesai", "Data endpoint terbaru telah didaftarkan ke server.", "success");
                    } else {
                      addToast("Gagal", "Harap izinkan notifikasi terlebih dahulu.", "warning");
                    }
                  }}
                  className="px-4 py-2 bg-[#0F4C3A] text-[#ECC17A] text-xs font-bold rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  Sinkron Server (Sync Now)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {Object.keys(rutinReminders).map((key) => {
                const item = rutinReminders[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition-colors ${item.enable ? "bg-[#0F4C3A] text-[#ECC17A]" : "bg-slate-200 text-slate-500"}`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${item.enable ? "text-slate-800" : "text-slate-500"}`}>
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Beri tahu saya pada waktu ini setiap hari</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <input
                        type="time"
                        value={item.time}
                        onChange={(e) => setRutinReminders(p => ({ ...p, [key]: { ...p[key], time: e.target.value } }))}
                        className="bg-white border border-slate-200 text-slate-700 text-sm font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20"
                      />
                      <button
                        onClick={() => setRutinReminders(p => ({ ...p, [key]: { ...p[key], enable: !p[key].enable } }))}
                        className={`relative w-11 h-6 flex items-center rounded-full transition-colors cursor-pointer ${item.enable ? 'bg-[#0F4C3A]' : 'bg-slate-300'}`}
                      >
                        <span className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${item.enable ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-2">
              <p className="text-[11px] text-slate-400 font-medium">
                Notifikasi menggunakan alarm browser. Pastikan browser tidak dalam mode tidur.
              </p>
              <button
                onClick={saveRutinReminders}
                className="px-6 py-3 bg-[#0F4C3A] hover:bg-emerald-900 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-900/20"
              >
                Simpan Alarm
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: BOOKMARK DIRECTORY LIST */}
        {activeMenu === "bookmarks" && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif font-bold text-[#0F4C3A] text-xl">
                Markah Bacaan Quran
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Daftar lengkap ayat-ayat yang Anda tandai demi memudahkan
                muraja'ah.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-2">
              {bookmarks.length > 0 ? (
                bookmarks.map((b) => (
                  <div
                    key={`${b.surahNo}_${b.ayatNo}`}
                    className="p-5 bg-white border border-slate-200/60 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:border-emerald-300 hover:shadow-md transition-all gap-4 group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-12 h-12 rounded-xl bg-emerald-50 text-[#0F4C3A] font-serif font-bold text-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#0F4C3A] group-hover:text-[#ECC17A] transition-colors shadow-sm">
                        {b.surahNo}:{b.ayatNo}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-[15px] group-hover:text-[#0F4C3A] transition-colors truncate">
                          Surat {b.surahName}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-400 tracking-widest mt-1 uppercase">
                          AYAT KE-{b.ayatNo} • DITANDAI PADA{" "}
                          {new Date(b.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-2 sm:mt-0">
                      <button
                        onClick={() => {
                          removeBookmark(b.surahNo, b.ayatNo);
                          addToast(
                            "Bookmark Dihapus",
                            "Ayat dibuang dari markah.",
                            "info",
                          );
                        }}
                        className="px-4 py-2 border border-red-200/50 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => onJumpToSurah(b.surahNo)}
                        className="px-5 py-2 bg-gradient-to-r from-[#0F4C3A] to-emerald-900 hover:opacity-90 text-[#ECC17A] rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        Buka
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200/60">
                  <Bookmark className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-3" />
                  <p className="text-[13px] font-bold text-slate-500">
                    Belum ada ayat yang ditandai bookmark.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: SPUR OF MOMENT NOTES/REFLECTION DIRECTORY */}
        {activeMenu === "notes" && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif font-bold text-[#0F4C3A] text-xl">
                Catatan & Tadabbur
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Kompilasi pemikiran dan buah tadabbur pribadi yang dicatat dalam
                mushaf.
              </p>
            </div>

            <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-2">
              {notes.length > 0 ? (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-5 sm:p-6 bg-white border border-slate-200/60 rounded-[28px] flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-bl-full pointer-events-none opacity-50"></div>

                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-[#0F4C3A] text-[#ECC17A] font-bold text-xs flex items-center justify-center shadow-sm">
                          QS
                        </span>
                        <h4 className="font-bold text-slate-800 text-[15px] group-hover:text-[#0F4C3A] transition-colors">
                          {n.surahName} • Ayat {n.ayatNo}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold tracking-widest text-[#0F4C3A] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/50">
                        {new Date(n.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content text */}
                    <div className="bg-[#FDFBF7] p-5 rounded-[20px] border border-slate-200/60 relative z-10">
                      <p className="text-sm leading-relaxed text-slate-700 font-medium select-all italic">
                        "{n.text}"
                      </p>
                    </div>

                    {/* Actions control */}
                    <div className="flex gap-2 justify-end relative z-10 mt-1">
                      <button
                        onClick={() => {
                          deleteNote(n.id);
                          addToast(
                            "Catatan Dihapus",
                            "Catatan tadabbur berhasil dihapus.",
                            "info",
                          );
                        }}
                        className="px-4 py-2 bg-white border border-red-200/50 text-red-500 hover:bg-red-50 text-[11px] font-bold rounded-xl transition cursor-pointer"
                      >
                        Hapus Catatan
                      </button>
                      <button
                        onClick={() => onJumpToSurah(n.surahNo)}
                        className="px-5 py-2 bg-gradient-to-r from-[#0F4C3A] to-emerald-900 shadow-sm text-[#ECC17A] text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer hover:opacity-90 hover:shadow-md"
                      >
                        Jelajahi Ayat
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200/60">
                  <Shield className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-3" />
                  <p className="text-[13px] font-bold text-slate-500">
                    Belum ada catatan tadabbur yang ditulis.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: SUPPORT / GIFT */}
        {activeMenu === "support" && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif font-bold text-[#0F4C3A] text-xl">
                Dukungan & Gift
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Salurkan dukungan Anda untuk pengembangan Quran Saku App dan
                dakwah Islam.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-6 border border-emerald-100/60 p-8 rounded-[32px] bg-gradient-to-br from-[#FDFBF7] to-emerald-50/40 shadow-sm relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>

              <div className="flex flex-col gap-1.5 text-center relative z-10">
                <span className="text-[12px] font-extrabold tracking-widest text-[#0F4C3A] uppercase mb-2">
                  Rekening Infaq Dakwah
                </span>
                <div className="flex items-center justify-center gap-3 my-2 mt-3">
                  <div className="w-12 h-12 bg-[#0F4C3A] text-[#ECC17A] rounded-2xl flex items-center justify-center shadow-md border border-emerald-700">
                    <Landmark className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-xl font-bold text-slate-800 tracking-tight">
                    Bank BSI
                  </span>
                </div>
                <span className="text-[32px] sm:text-[40px] font-serif font-bold tracking-wider text-slate-800 my-2">
                  7335435332
                </span>
                <span className="text-sm font-bold text-[#0F4C3A] tracking-wide uppercase">
                  A.N. Habib Ismail Al Qadri
                </span>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText("7335435332");
                  addToast(
                    "Berhasil Disalin",
                    "Nomor rekening berhasil disalin ke clipboard.",
                    "success",
                  );
                }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-emerald-200/60 text-[#0F4C3A] text-sm font-bold rounded-2xl shadow-sm hover:border-[#0F4C3A] hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer relative z-10"
              >
                <Copy className="w-5 h-5" />
                Salin Nomor Rekening
              </button>
            </div>

            <p className="text-[13px] text-center text-slate-500 font-medium px-4 leading-relaxed mt-4 italic">
              "Perumpamaan orang yang menginfakkan hartanya di jalan Allah
              seperti sebutir biji yang menumbuhkan tujuh tangkai, pada setiap
              tangkai ada seratus biji..." <br />
              <span className="font-bold text-[#0F4C3A] block mt-2 opacity-80">
                (Al-Baqarah: 261)
              </span>
            </p>
          </div>
        )}
        {/* VIEW 5: ABOUT APPLICATION */}
        {activeMenu === "about" && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif font-bold text-[#0F4C3A] text-xl">
                Tentang Aplikasi
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Fitur, Fungsi, dan Pengembang Quran Saku App.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-3">
              <div className="bg-[#FDFBF7] border border-slate-200/60 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-2xl opacity-60"></div>
                <h4 className="font-bold text-[#0F4C3A] text-[15px] mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100/50 flex items-center justify-center">
                    🧑‍💻
                  </span>
                  Developer
                </h4>
                <p className="text-sm font-medium text-slate-600 leading-relaxed pl-1 relative z-10">
                  Aplikasi ini dikembangkan oleh{" "}
                  <span className="font-bold text-[#0F4C3A]">
                    Habib Ismail Al Qadri
                  </span>
                  . Dibangun dengan niat dakwah untuk memudahkan umat Islam
                  dalam membaca, mempelajari, dan menadabburi ayat suci
                  Al-Qur'an secara digital kapanpun dan di manapun.
                </p>
              </div>

              <div className="bg-white border border-emerald-100/60 rounded-[28px] p-6 shadow-sm">
                <h4 className="font-bold text-[#0F4C3A] text-[15px] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    ✨
                  </span>
                  Fitur & Fungsi Utama
                </h4>
                <ul className="flex flex-col gap-4">
                  <li className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0F4C3A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-emerald-100/50">
                      <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed mt-1">
                      <span className="font-bold text-slate-800">
                        Mushaf Digital:
                      </span>{" "}
                      Membaca Al-Qur'an 30 Juz lengkap dengan tajwid,
                      terjemahan, dan audio Murottal per ayat.
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0F4C3A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-emerald-100/50">
                      <Compass className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed mt-1">
                      <span className="font-bold text-slate-800">
                        Arah Kiblat & Waktu Sholat:
                      </span>{" "}
                      Navigasi presisi Kiblat berdasarkan GPS lokal serta jadwal
                      adzan akurat secara otomatis.
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C3A] to-emerald-800 text-[#ECC17A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-emerald-900">
                      <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed mt-1">
                      <span className="font-bold text-[#0F4C3A]">
                        Tanya Ustadz AI:
                      </span>{" "}
                      Bimbingan Islami interaktif berbasis AI dengan rujukan
                      komprehensif ke ayat Al-Qur'an dan Hadits real-time.
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0F4C3A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-emerald-100/50">
                      <Bookmark className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed mt-1">
                      <span className="font-bold text-slate-800">
                        Markah & Catatan:
                      </span>{" "}
                      Menandai progres tilawah dan merangkum hasil tadabbur
                      dengan sinkronisasi lokal instan.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
