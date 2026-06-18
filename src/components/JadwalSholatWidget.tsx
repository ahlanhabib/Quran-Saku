/**
 * @author Habib Ismail Al Qadri
 * @app Quran Saku
 */
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  Map,
  Clock,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Check,
  ChevronRight,
} from "lucide-react";
import { SholatCity, PrayerSchedule } from "../types";
import { DEFAULT_CITIES } from "../data";

interface SholatWidgetProps {
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
}

export const JadwalSholatWidget: React.FC<SholatWidgetProps> = ({
  addToast,
}) => {
  // Cities selection
  const [selectedCity, setSelectedCity] = useState<SholatCity>(() => {
    try {
      const saved = localStorage.getItem("qd_selectedCity");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { id: "1301", lokasi: "KOTA JAKARTA" };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SholatCity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("qd_selectedCity", JSON.stringify(selectedCity));
  }, [selectedCity]);

  // Prayer schedules
  const [schedule, setSchedule] = useState<PrayerSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Notifications toggles
  const [notifiedPrayers, setNotifiedPrayers] = useState<{
    [key: string]: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("qd_notifiedPrayers");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      imsak: false,
      subuh: true,
      terbit: false,
      dhuha: false,
      dzuhur: true,
      ashar: true,
      maghrib: true,
      isya: true,
    };
  });

  useEffect(() => {
    localStorage.setItem("qd_notifiedPrayers", JSON.stringify(notifiedPrayers));
  }, [notifiedPrayers]);

  // Countdown timers
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextSholat, setNextSholat] = useState<{
    name: string;
    time: string;
    remaining: string;
  } | null>(null);

  // Fetch sholat schedule
  const fetchSchedule = async (cityId: string) => {
    setIsLoading(true);
    try {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, "0");
      const dy = String(now.getDate()).padStart(2, "0");
      const dateKey = `${yr}-${mo}-${dy}`;

      const response = await fetch(
        `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${yr}/${mo}/${dy}`,
      );
      if (!response.ok) throw new Error("Gagal mengunduh jadwal");

      const payload = await response.json();
      if (payload.status && payload.data?.jadwal) {
        setSchedule(payload.data.jadwal);
      } else {
        // Fallback mocked schedule in case API is down for some reason
        const mock: PrayerSchedule = {
          tanggal: `${dy}/${mo}/${yr}`,
          imsak: "04:31",
          subuh: "04:41",
          terbit: "05:58",
          dhuha: "06:26",
          dzuhur: "11:58",
          ashar: "15:19",
          maghrib: "17:51",
          isya: "19:05",
          date: `${yr}-${mo}-${dy}`,
        };
        setSchedule(mock);
      }
    } catch (err) {
      console.error(err);
      // fallback
      const now = new Date();
      const mock: PrayerSchedule = {
        tanggal: `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
        imsak: "04:31",
        subuh: "04:41",
        terbit: "05:58",
        dhuha: "06:26",
        dzuhur: "11:58",
        ashar: "15:19",
        maghrib: "17:51",
        isya: "19:05",
        date: "2026-06-11",
      };
      setSchedule(mock);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on city change
  useEffect(() => {
    if (selectedCity.id === "COORD") return;
    fetchSchedule(selectedCity.id);
  }, [selectedCity]);

  // Handle live clock & next sholat countdown calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Recalculate next prayer when clock or schedule updates
  useEffect(() => {
    if (!schedule) {
      setNextSholat(null);
      return;
    }

    const prayerTimes = [
      { name: "Imsak", time: schedule.imsak },
      { name: "Subuh", time: schedule.subuh },
      { name: "Terbit", time: schedule.terbit },
      { name: "Dhuha", time: schedule.dhuha },
      { name: "Dzuhur", time: schedule.dzuhur },
      { name: "Ashar", time: schedule.ashar },
      { name: "Maghrib", time: schedule.maghrib },
      { name: "Isya", time: schedule.isya },
    ];

    const now = new Date();
    const currentHrs = now.getHours();
    const currentMins = now.getMinutes();
    const currentSecs = now.getSeconds();
    const currentTotalSecs = currentHrs * 3600 + currentMins * 60 + currentSecs;

    let targetSholat = null;

    // Find the next sholat today
    for (const p of prayerTimes) {
      if (!p.time) continue;
      const timeParts = p.time.split(":");
      if (timeParts.length < 2) continue;
      const [shours, sminutes] = timeParts.map(Number);
      const targetTotalSecs = shours * 3600 + sminutes * 60;

      if (targetTotalSecs > currentTotalSecs) {
        const diff = targetTotalSecs - currentTotalSecs;
        const hr = Math.floor(diff / 3600);
        const mn = Math.floor((diff % 3600) / 60);
        const sc = diff % 60;

        targetSholat = {
          name: p.name,
          time: p.time,
          remaining: `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}:${String(sc).padStart(2, "0")}`,
        };
        break;
      }
    }

    // If none found, next is tomorrow's Imsak/Subuh
    if (!targetSholat && schedule?.subuh) {
      const timeParts = schedule.subuh.split(":");
      if (timeParts.length >= 2) {
         const [shours, sminutes] = timeParts.map(Number);
         const targetTotalSecs = shours * 3600 + sminutes * 60 + 24 * 3600; // Tomorrow
         const diff = targetTotalSecs - currentTotalSecs;
         const hr = Math.floor(diff / 3600);
         const mn = Math.floor((diff % 3600) / 60);
         const sc = diff % 60;
   
         targetSholat = {
           name: "Subuh (Esok Hari)",
           time: schedule.subuh,
           remaining: `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}:${String(sc).padStart(2, "0")}`,
         };
      }
    }

    setNextSholat(targetSholat);

    if (targetSholat) {
      const canonicalName = targetSholat.name.toLowerCase();
      const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${canonicalName}`;
      
      const timeParts = targetSholat.time.split(":");
      if (timeParts.length >= 2) {
        let [shours, sminutes] = timeParts.map(Number);
        if (targetSholat.name.includes("Esok Hari")) {
          shours += 24;
        }
        const targetTotalSecs = shours * 3600 + sminutes * 60;
        const diff = targetTotalSecs - currentTotalSecs;
        
        // Sholat Adhan (window of 1 minute)
        if (diff <= 60 && diff >= -60) {
          const adhanKey = `adhan-${todayKey}`;
          if (notifiedPrayers[canonicalName] && localStorage.getItem("qd_last_adhan") !== adhanKey) {
            localStorage.setItem("qd_last_adhan", adhanKey);
            addToast(
              `⏱️ Waktu Sholat Tiba!`,
              `Saatnya menunaikan ibadah Sholat ${targetSholat.name} untuk wilayah ${selectedCity.lokasi}. Mari bersiap menghadap-Nya.`,
              "notification",
            );

            if ("Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(`Waktu Sholat ${targetSholat.name}`, {
                  body: `Telah masuk waktu sholat ${targetSholat.name} untuk wilayah ${selectedCity.lokasi}.`,
                  icon: "/icons/icon-192x192.png",
                  badge: "/icons/icon-192x192.png",
                  vibrate: [300, 100, 300, 100, 300],
                  tag: `sholat-${canonicalName}`,
                } as any);
              });
            }
            playAdhanTone(targetSholat.name);
          }
        }
        
        // 15-minute reminder
        if (diff <= 15 * 60 && diff >= 14 * 60) {
          const prepKey = `prep-${todayKey}`;
          if (
            notifiedPrayers[canonicalName] && 
            ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].includes(canonicalName.replace(' (esok hari)', '')) &&
            localStorage.getItem("qd_last_prep") !== prepKey
          ) {
            localStorage.setItem("qd_last_prep", prepKey);
            addToast(
              `🕌 15 Menit Menuju ${targetSholat.name}`,
              `Segera bersiap, ambil wudhu, dan hentikan aktivitas. Waktu ${targetSholat.name} akan masuk sebentar lagi di wilayah ${selectedCity.lokasi}.`,
              "notification",
            );
    
            if ("Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(`Bersiap Sholat ${targetSholat.name}`, {
                  body: `15 menit lagi masuk waktu sholat ${targetSholat.name} untuk wilayah ${selectedCity.lokasi}.`,
                  icon: "/icons/icon-192x192.png",
                  badge: "/icons/icon-192x192.png",
                  vibrate: [200, 100, 200],
                  tag: `prep-sholat-${canonicalName}`,
                } as any);
              });
            }
          }
        }
      }
    }
  }, [currentTime, schedule, notifiedPrayers, selectedCity]);

  // Play audio file for adhan notification
  const playAdhanTone = (prayerName: string) => {
    try {
      const audioPath =
        prayerName.toLowerCase() === "subuh" ? "/Subuh.mp3" : "/Azan.mp3";
      const audio = new Audio(audioPath);
      audio.play().catch((e) => {
        console.warn("Audio playback blocked", e);
      });
    } catch (e) {
      console.warn("Audio Context blocked", e);
    }
  };

  // Searching cities
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(searchQuery)}`,
      );
      if (!response.ok) throw new Error();
      const payload = await response.json();
      if (payload.status && Array.isArray(payload.data)) {
        // Adapt v3 format to our expected data array
        const normalizedData = payload.data.map((c: any) => ({
          id: c.id,
          lokasi: c.lokasi || c.kabko, // v3 sometimes uses kabko or lokasi
        }));
        setSearchResults(normalizedData);
      } else {
        setSearchResults([]);
        addToast(
          "Kota Tidak Ditemukan",
          "Coba gunakan kata kunci kota lain di Indonesia.",
          "warning",
        );
      }
    } catch {
      setSearchResults([]);
      addToast(
        "Gangguan Pencarian",
        "Gagal memproses pencarian kota dari server.",
        "warning",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const selectCityHandler = (city: SholatCity) => {
    setSelectedCity(city);
    localStorage.setItem("qd_has_located", "1");
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
    addToast(
      "Kota Diperbarui",
      `Menampilkan jadwal sholat untuk ${city.lokasi}`,
      "success",
    );
  };

  const getGPSLocation = (silent: boolean = false) => {
    if (!navigator.geolocation) {
      if (!silent)
        addToast(
          "Tidak Didukung",
          "Fitur GPS tidak didukung browser Anda.",
          "warning",
        );
      setIsLoading(false);
      return;
    }

    if (!silent)
      addToast(
        "Mencari Lokasi GPS...",
        "Mengakses koordinat satelit peranti Anda...",
        "info",
      );
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          let displayName = "Lokasi Saat Ini";
          try {
            const r = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`,
            );
            if (r.ok) {
              const data = await r.json();
              displayName =
                data.city ||
                data.locality ||
                data.principalSubdivision ||
                "Lokasi Saat Ini";
            }
          } catch (e) {}

          const now = new Date();
          const yr = now.getFullYear();
          const mo = now.getMonth() + 1;
          const dy = now.getDate();

          const aladhanRes = await fetch(
            `https://api.aladhan.com/v1/timings/${dy}-${mo}-${yr}?latitude=${lat}&longitude=${lon}&method=11`,
          );
          if (!aladhanRes.ok)
            throw new Error("Gagal mengambil jadwal berdasar koordinat");
          const asData = await aladhanRes.json();

          if (asData.code === 200 && asData.data && asData.data.timings) {
            const timings = asData.data.timings;
            const coordSchedule: PrayerSchedule = {
              tanggal: `${String(dy).padStart(2, "0")}/${String(mo).padStart(2, "0")}/${yr}`,
              imsak: timings.Imsak,
              subuh: timings.Fajr,
              terbit: timings.Sunrise,
              dhuha: timings.Sunrise,
              dzuhur: timings.Dhuhr,
              ashar: timings.Asr,
              maghrib: timings.Maghrib,
              isya: timings.Isha,
              date: `${yr}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}`,
            };

            const dynamicCity: SholatCity = {
              id: "COORD",
              lokasi: displayName,
            };

            setSelectedCity(dynamicCity);
            setSchedule(coordSchedule);
            localStorage.setItem("qd_has_located", "1");
            setIsLoading(false);

            if (!silent)
              addToast(
                "GPS Terkunci!",
                `Jadwal sholat akurat sesuai koordinat GPS (${displayName}).`,
                "success",
              );
          } else {
            throw new Error("Invalid Aladhan structure");
          }
        } catch (err) {
          if (!silent)
            addToast(
              "Jadwal Koordinat Gagal",
              "Gagal memproses posisi. Menggunakan default.",
              "warning",
            );
          setSelectedCity({ id: "1301", lokasi: "KOTA JAKARTA" });
          localStorage.setItem("qd_has_located", "1");
          setIsLoading(false);
        }
      },
      (err) => {
        if (!silent)
          addToast(
            "GPS Gagal",
            "Harap izinkan hak akses atau tulis nama kota secara manual.",
            "warning",
          );
        if (selectedCity.id !== "COORD") {
          fetchSchedule(selectedCity.id);
        } else {
          setSelectedCity({ id: "1301", lokasi: "KOTA JAKARTA" });
          localStorage.setItem("qd_has_located", "1");
          setIsLoading(false);
        }
      },
    );
  };

  const getIPLocation = async () => {
    try {
      const r = await fetch(
        "https://api.bigdatacloud.net/data/reverse-geocode-client",
      );
      if (!r.ok) return;
      const data = await r.json();

      const keywords = [];
      if (data.city)
        keywords.push(data.city.replace(/Kabupaten|Kota|Kab\./gi, "").trim());
      if (data.locality)
        keywords.push(
          data.locality.replace(/Kabupaten|Kota|Kab\./gi, "").trim(),
        );

      let foundCity = null;

      for (const kw of keywords) {
        if (!kw) continue;
        const s = await fetch(
          `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kw)}`,
        );
        if (!s.ok) continue;
        const sData = await s.json();
        if (
          sData.status &&
          Array.isArray(sData.data) &&
          sData.data.length > 0
        ) {
          foundCity = sData.data[0];
          break;
        }
      }

      if (foundCity) {
        setSelectedCity({
          id: foundCity.id,
          lokasi: foundCity.lokasi || foundCity.kabko,
        });
        localStorage.setItem("qd_has_located", "1");
        addToast(
          "Lokasi Terdeteksi",
          `Menggunakan lokasi perkiraan: ${foundCity.lokasi || foundCity.kabko}`,
          "info",
        );
      }
    } catch (e) {
      // fail silently
    }
  };

  useEffect(() => {
    // Automatically detect exact coordinate location on mount
    getGPSLocation(true);
  }, []);

  const togglePrayerNotification = (prayer: string) => {
    setNotifiedPrayers((prev) => {
      const updated = { ...prev, [prayer]: !prev[prayer] };

      // Request service worker / browser notification permission if activated
      if (updated[prayer] && "Notification" in window) {
        if (
          Notification.permission !== "granted" &&
          Notification.permission !== "denied"
        ) {
          Notification.requestPermission();
        }
      }

      addToast(
        updated[prayer] ? "Alarm Aktif" : "Alarm Dimatikan",
        `Pengingat adzan Sholat ${prayer.toUpperCase()} sekarang ${updated[prayer] ? "aktif" : "nonaktif"}.`,
        "info",
      );
      return updated;
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-6">
      {/* Header section: Selected Location, Live countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-800">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-xs font-bold text-slate-400 tracking-wider mb-0.5 block">
              WILAYAH
            </span>
            <div className="flex flex-row items-end flex-wrap gap-x-3 gap-y-1">
              <h3 className="text-[17px] sm:text-lg font-bold text-slate-800 leading-snug break-words">
                {selectedCity.lokasi}
              </h3>
              <button
                onClick={() => setShowSearchModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-800 underline font-semibold pb-[3px] cursor-pointer focus:outline-none flex-shrink-0"
              >
                Ganti Kota
              </button>
            </div>
          </div>
        </div>

        {/* Live timer / countdown badge */}
        {nextSholat && (
          <div className="bg-[#0F4C3A] text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-emerald-950/10">
            <div className="p-2 bg-white/10 rounded-xl">
              <Clock className="w-5 h-5 text-[#ECC17A]" />
            </div>
            <div>
              <p className="text-[10px] text-teal-100 font-bold tracking-wider">
                BERIKUTNYA: SHOLAT {nextSholat.name.toUpperCase()}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-mono font-bold tracking-tight text-[#ECC17A]">
                  {nextSholat.remaining}
                </span>
                <span className="text-xs text-white/70 italic">
                  ({nextSholat.time})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of prayer schedule items */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-2">
              <div className="w-12 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-16 h-6 bg-slate-300 rounded animate-pulse my-1"></div>
              <div className="w-6 h-6 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { tag: "Imsak", time: schedule?.imsak, canon: "imsak" },
            { tag: "Subuh", time: schedule?.subuh, canon: "subuh" },
            { tag: "Terbit", time: schedule?.terbit, canon: "terbit" },
            { tag: "Dhuha", time: schedule?.dhuha, canon: "dhuha" },
            { tag: "Dzuhur", time: schedule?.dzuhur, canon: "dzuhur" },
            { tag: "Ashar", time: schedule?.ashar, canon: "ashar" },
            { tag: "Maghrib", time: schedule?.maghrib, canon: "maghrib" },
            { tag: "Isya", time: schedule?.isya, canon: "isya" },
          ].map((item) => {
            const isNext = nextSholat && nextSholat.name === item.tag;
            const hasNotify = notifiedPrayers[item.canon];

            return (
              <motion.div
                key={item.tag}
                whileHover={{ y: -3 }}
                className={`relative px-3.5 py-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center justify-between ${
                  isNext
                    ? "bg-emerald-50/70 border-emerald-500 shadow-sm"
                    : "bg-slate-50/50 border-slate-100"
                }`}
              >
                {/* Active Next Indicator Badge */}
                {isNext && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-bold tracking-wide shadow-sm">
                    AKTIF
                  </span>
                )}

                <span className="text-xs font-semibold text-slate-500">
                  {item.tag}
                </span>
                <span
                  className={`text-lg font-bold font-mono my-2 ${isNext ? "text-[#0F4C3A]" : "text-slate-800"}`}
                >
                  {item.time || "--:--"}
                </span>

                {/* Alarm notification toggle icon button */}
                {["imsak", "subuh", "terbit", "dhuha", "dzuhur", "ashar", "maghrib", "isya"].includes(
                  item.canon,
                ) ? (
                  <button
                    onClick={() => togglePrayerNotification(item.canon)}
                    className={`mt-1 p-1.5 rounded-full transition-colors cursor-pointer ${
                      hasNotify
                        ? "bg-emerald-100 text-[#0F4C3A] hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {hasNotify ? (
                      <Bell className="w-3.5 h-3.5" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  <span className="h-6.5 text-[8px] text-slate-300 flex items-center">
                    -
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Action panel */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl">
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-sm font-bold text-slate-700">
            Notifikasi Otomatis Pengingat Adzan
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Aplikasi melalukan hit mingguan jadwal sholat dan memicu notifikasi
            adzan di latar belakang.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-center">
          <button
            onClick={() => getGPSLocation(false)}
            className="px-4 py-2.5 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer rounded-xl text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto min-w-[140px]"
          >
            <Map className="w-4 h-4 text-emerald-700" />
            Gunakan GPS Anda
          </button>
          <button
            onClick={() => setShowSearchModal(true)}
            className="px-4 py-2.5 sm:py-2 bg-[#0F4C3A] hover:bg-[#0a3629] text-white cursor-pointer rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow w-full sm:w-auto min-w-[120px]"
          >
            <Search className="w-4 h-4" />
            Cari Kota
          </button>
        </div>
      </div>

      {/* Elegant Modal: Change City Search */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showSearchModal && (
              <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom,20px)] sm:p-6 z-[90]">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 10 }}
                  className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85dvh] mb-4 sm:mb-0"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-serif font-bold text-[#0F4C3A]">
                      Pilih Kota & Waktu
                    </h3>
                    <button
                      onClick={() => {
                        setShowSearchModal(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-lg text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Form Search */}
                  <form onSubmit={handleSearch} className="p-6 pb-4 flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Contoh: Jakarta, Surabaya, Bandung..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20"
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-4 py-2.5 bg-[#0F4C3A] hover:bg-emerald-900 transition-colors text-white rounded-xl text-sm font-bold flex items-center"
                    >
                      {isSearching ? "Cari..." : "Cari"}
                    </button>
                  </form>

                  {/* Scrollable listing of cities */}
                  <div className="flex-1 overflow-y-auto p-6 pt-0 flex flex-col gap-2">
                    {searchResults.length > 0 ? (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-2">
                          HASIL PENCARIAN
                        </h4>
                        <div className="flex flex-col gap-1.5/2">
                          {searchResults.map((city) => (
                            <button
                              key={city.id}
                              onClick={() => selectCityHandler(city)}
                              className="w-full text-left px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 text-sm font-medium transition-all flex items-center justify-between"
                            >
                              <span>{city.lokasi}</span>
                              <ChevronRight className="w-4 h-4 text-emerald-800" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-2.5">
                          KOTA TERPOPULER
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {DEFAULT_CITIES.map((city) => {
                            const isCurrent = city.id === selectedCity.id;
                            return (
                              <button
                                key={city.id}
                                onClick={() => selectCityHandler(city)}
                                className={`text-left p-3 rounded-xl border transition-all text-xs font-bold flex items-center justify-between ${
                                  isCurrent
                                    ? "bg-emerald-100/60 border-emerald-300 text-[#0F4C3A]"
                                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600"
                                }`}
                              >
                                <span className="truncate">
                                  {city.lokasi.replace("KOTA ", "")}
                                </span>
                                {isCurrent && <Check className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
