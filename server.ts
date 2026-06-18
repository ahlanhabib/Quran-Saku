import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import webpush from "web-push";
import cron from "node-cron";
import fs from "fs";

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// V2 to V3 City ID Map and resolver
const V2_TO_V3_MAP: Record<string, string> = {
  "1301": "58a2fc6ed39fd083f55d4182bf88826d", // KOTA JAKARTA
  "1210": "c1f71dfbc62b7ff017f7872f0dbb2247", // KOTA BANDUNG
  "1638": "4734ba6f3de83d861c3176a6273cac6d", // KOTA SURABAYA
  "1430": "577ef1154f3240ad5b9b413aa7346a1e", // KOTA YOGYAKARTA
  "0115": "2838023a778dfaecdc212708f721b788", // KOTA MEDAN
  "2212": "b7b16ecf8ca53723593894116071700c", // KOTA MAKASSAR
  "1708": "6a9aeddfc689c1d0e3b9ccc3ab651bc5", // KOTA DENPASAR
  "1505": "e96ed478dab8595a7dbda4cbcbee168f", // KAB. SEMARANG
  "0814": "1afa34a7f984eeabdbb0a7d494132ee5", // KOTA PALEMBANG
  "1810": "00411460f7c92d2124a67ea0f4cb5f85", // KOTA BALIKPAPAN
  "2115": "550a141f12de6341fba65b0ad0433500"  // KOTA MANADO
};

function resolveCityId(id: string): string {
  if (V2_TO_V3_MAP[id]) {
    return V2_TO_V3_MAP[id];
  }
  if (/^\d+$/.test(id)) {
    return "58a2fc6ed39fd083f55d4182bf88826d"; // Fallback KOTA JAKARTA
  }
  return id;
}

// ---- WEB PUSH SETUP ----
let vapidKeys: { publicKey: string; privateKey: string };
try {
  if (fs.existsSync("vapid.json")) {
    vapidKeys = JSON.parse(fs.readFileSync("vapid.json", "utf8"));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync("vapid.json", JSON.stringify(vapidKeys));
  }
} catch (e) {
  vapidKeys = webpush.generateVAPIDKeys();
}

webpush.setVapidDetails(
  "mailto:ahlanhabibana@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ============================================
// FIREBASE FIRESTORE FOR SUBSCRIPTIONS
// ============================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import fs from "fs";

let db: any = null;
try {
  if (fs.existsSync("firebase-applet-config.json")) {
    const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
    const app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId);
    console.log("Firebase initialized for server subscriptions");
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

// In-Memory map just as a fallback or cache
let subscriptions: Record<string, any> = {};

// We will fetch subscriptions dynamically from Firestore when running the cron.
async function getAllSubscriptions() {
  if (!db) return subscriptions; // fallback
  try {
    const snap = await getDocs(collection(db, "pushSubscriptions"));
    const subs: Record<string, any> = {};
    snap.forEach(d => {
      subs[d.id] = d.data();
    });
    return subs;
  } catch (e) {
    console.error("Error fetching subscriptions:", e);
    return subscriptions; // fallback
  }
}

async function saveSubscription(endpoint: string, data: any) {
  subscriptions[endpoint] = data; // update local instantly
  if (db) {
    try {
      // Use a hashed endpoint or just an encoded url as ID
      const safeId = Buffer.from(endpoint).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await setDoc(doc(db, "pushSubscriptions", safeId), data);
    } catch (e) {
      console.error("Error saving subscription:", e);
    }
  }
}

async function removeSubscription(endpoint: string) {
  delete subscriptions[endpoint];
  if (db) {
    try {
      const safeId = Buffer.from(endpoint).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await deleteDoc(doc(db, "pushSubscriptions", safeId));
    } catch (e) {
      console.error("Error removing subscription:", e);
    }
  }
}
// ------------------------

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ---- WEB PUSH ENDPOINTS ----
  app.get("/api/push/public-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    const { subscription, cityId, rutinReminders, sholatSchedule, selectedCity, timezone } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription" });
    }
    
    // Fetch all current subscriptions to get existing data for merge
    const currentSubs = await getAllSubscriptions();
    const existing = currentSubs[subscription.endpoint] || {};

    const newData = { 
      ...existing,
      subscription, 
      cityId: cityId || existing.cityId, 
      rutinReminders: rutinReminders || existing.rutinReminders,
      sholatSchedule: sholatSchedule || existing.sholatSchedule,
      selectedCity: selectedCity || existing.selectedCity,
      timezone: timezone || existing.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      updatedAt: new Date().toISOString()
    };
    
    await saveSubscription(subscription.endpoint, newData);
    
    res.status(201).json({ status: "success" });
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    const { endpoint } = req.body;
    if (endpoint) {
      await removeSubscription(endpoint);
    }
    res.json({ status: "success" });
  });

  const runCronJobs = async () => {
    const now = new Date();
    const currentSubscriptions = await getAllSubscriptions();
    
    for (const [endpoint, data] of Object.entries(currentSubscriptions)) {
       const sub = data.subscription;
       if (!sub) continue;
       
       const userTz = data.timezone || "Asia/Jakarta";
       
       const formatTime = (d: Date) => {
           const parts = new Intl.DateTimeFormat("en-GB", { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
           let hr = parts.find(p => p.type === 'hour')?.value || '00';
           if (hr === '24') hr = '00';
           const mn = parts.find(p => p.type === 'minute')?.value || '00';
           return `${hr}:${mn}`;
       };
       
       const timeStr = formatTime(now);
       const futureTimeStr = formatTime(new Date(now.getTime() + 15 * 60000));
       
       const dayStr = new Intl.DateTimeFormat("en-US", { timeZone: userTz, weekday: 'short' }).format(now).substring(0,3);
       const daysMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
       const day = daysMap[dayStr] ?? now.getDay();
       
       const dParts = new Intl.DateTimeFormat("en-US", { timeZone: userTz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
       const targetDateString = `${dParts.find(p => p.type === 'year')?.value}-${dParts.find(p => p.type === 'month')?.value}-${dParts.find(p => p.type === 'day')?.value}`;
       
       const rutin = data.rutinReminders || {};
       let jadwalToUse = data.sholatSchedule || {};
       const cityName = data.selectedCity?.lokasi || "wilayah Anda";
       const userCityId = data.cityId || data.selectedCity?.id;
       
       // Compare rutin times
       for (const key of Object.keys(rutin)) {
          const reminder = rutin[key];
          if (reminder.enable && reminder.time === timeStr) {
             if (reminder.days && Array.isArray(reminder.days) && !reminder.days.includes(day)) {
               continue;
             }
             
             webpush.sendNotification(sub, JSON.stringify({
                title: `Waktunya ${reminder.name}!`,
                body: `Saatnya menunaikan kegiatan ibadah rutin Anda: ${reminder.name}.`,
                icon: "/icons/icon-192x192.png",
                tag: `rutin-${key}`
             })).catch(async err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                   await removeSubscription(endpoint);
                } else {
                   console.error("Push Error (Rutin):", err);
                }
             });
          }
       }
       
       // Process Sholat Schedule Push (Adhan & 15 mins Prep)
       // We only process if today matches the schedule 'date'
       if (userCityId && jadwalToUse && jadwalToUse.date !== targetDateString) {
           try {
               const resolvedId = resolveCityId(userCityId);
               const res = await fetch(`https://api.myquran.com/v3/sholat/jadwal/${resolvedId}/${targetDateString}`);
               if (res.ok) {
                   const v3Data = await res.json();
                   if (v3Data.status && v3Data.data?.jadwal) {
                       const singleJadwal = v3Data.data.jadwal[targetDateString];
                       if (singleJadwal) {
                           singleJadwal.date = targetDateString;
                           jadwalToUse = singleJadwal;
                           data.sholatSchedule = singleJadwal;
                           await saveSubscription(endpoint, data);
                       }
                   }
               }
           } catch(e) {}
       }
       
       if (jadwalToUse && jadwalToUse.date === targetDateString) {
          const mainPrayers = [
            { name: "Subuh", time: jadwalToUse.subuh },
            { name: "Dhuha", time: jadwalToUse.dhuha },
            { name: "Dzuhur", time: jadwalToUse.dzuhur },
            { name: "Ashar", time: jadwalToUse.ashar },
            { name: "Maghrib", time: jadwalToUse.maghrib },
            { name: "Isya", time: jadwalToUse.isya }
          ];
          
          for (const prayer of mainPrayers) {
            if (!prayer.time) continue;
            
            // 1. Sholat time
            if (prayer.time === timeStr) {
              webpush.sendNotification(sub, JSON.stringify({
                  title: `Waktu Sholat ${prayer.name}`,
                  body: `Telah masuk waktu sholat ${prayer.name} untuk wilayah ${cityName}.`,
                  icon: "/icons/icon-192x192.png",
                  tag: `sholat-${prayer.name.toLowerCase()}`,
                  isAdhan: true,
                  prayerName: prayer.name,
                  requireInteraction: true,
                  vibrate: [500, 200, 500, 200, 500, 200, 500, 200, 500]
              })).catch(err => console.error(err));
            }
            
            // 2. Preparation (15 mins prior)
            // Skip prep for Dhuha
            if (prayer.time === futureTimeStr && prayer.name !== "Dhuha") {
              webpush.sendNotification(sub, JSON.stringify({
                  title: `🕌 15 Menit Menuju ${prayer.name}`,
                  body: `Segera bersiap, ambil wudhu. Waktu ${prayer.name} akan masuk sebentar lagi di wilayah ${cityName}.`,
                  icon: "/icons/icon-192x192.png",
                  tag: `prep-sholat-${prayer.name.toLowerCase()}`
              })).catch(err => console.error(err));
            }
          }
       }
    }
  };

  // ---- TRIGGER CRON PUSH NOTIFICATIONS ----
  cron.schedule("* * * * *", runCronJobs);

  app.get("/api/push/trigger-cron", async (req, res) => {
    try {
      await runCronJobs();
      res.json({ status: "success", message: "Cron jobs manually triggered" });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  });
  // ----------------------------------------

  // API Route - Get all Sholat Cities (MyQuran v3)
  app.get("/api/sholat/kota/semua", async (req, res) => {
    try {
      const response = await fetch("https://api.myquran.com/v3/sholat/kota/semua");
      if (!response.ok) throw new Error("Gagal mengambil data kota");
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Search Sholat City (MyQuran v3)
  app.get("/api/sholat/kota/cari/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const response = await fetch(`https://api.myquran.com/v3/sholat/kota/cari/${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Gagal mencari kota");
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Get Sholat Schedule for specific city and date (MyQuran v3 translated to v2 format)
  app.get("/api/sholat/jadwal/:id_kota/:tahun/:bulan/:tanggal", async (req, res) => {
    try {
      const { id_kota, tahun, bulan, tanggal } = req.params;
      const resolvedId = resolveCityId(id_kota);
      const dateKey = `${tahun}-${bulan}-${tanggal}`;
      const response = await fetch(`https://api.myquran.com/v3/sholat/jadwal/${resolvedId}/${dateKey}`);
      if (!response.ok) throw new Error("Gagal mengambil jadwal sholat");
      
      const v3Data = await response.json();
      if (v3Data.status && v3Data.data?.jadwal) {
        const singleJadwal = v3Data.data.jadwal[dateKey];
        if (singleJadwal) {
          singleJadwal.date = dateKey;
          return res.json({
            status: true,
            message: "success",
            data: {
              id: v3Data.data.id,
              lokasi: v3Data.data.kabko,
              daerah: v3Data.data.prov,
              jadwal: singleJadwal
            }
          });
        }
      }
      throw new Error("Jadwal sholat tanggal tersebut tidak ditemukan");
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Get Sholat Schedule for specific city and full month (MyQuran v3 translated to v2 format)
  app.get("/api/sholat/jadwal/:id_kota/:tahun/:bulan", async (req, res) => {
    try {
      const { id_kota, tahun, bulan } = req.params;
      const resolvedId = resolveCityId(id_kota);
      const monthKey = `${tahun}-${bulan}`;
      const response = await fetch(`https://api.myquran.com/v3/sholat/jadwal/${resolvedId}/${monthKey}`);
      if (!response.ok) throw new Error("Gagal mengambil jadwal sholat bulanan");
      
      const v3Data = await response.json();
      if (v3Data.status && v3Data.data?.jadwal) {
        // Translate to flat array if needed, or proxy directly.
        // Usually v2 returns a list of items. Let's build a compatible list.
        const list = Object.entries(v3Data.data.jadwal).map(([date, item]: [string, any]) => {
          return {
            ...item,
            date
          };
        });
        return res.json({
          status: true,
          message: "success",
          data: {
            id: v3Data.data.id,
            lokasi: v3Data.data.kabko,
            daerah: v3Data.data.prov,
            jadwal: list
          }
        });
      }
      throw new Error("Jadwal sholat bulanan tidak ditemukan");
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Get all Quran Surahs (EQuran v2 API)
  app.get("/api/quran/surah", async (req, res) => {
    try {
      const response = await fetch("https://api.quran.gading.dev/surah");
      if (!response.ok) throw new Error("Gagal mengambil daftar surah");
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Get Single Quran Surah Details
  app.get("/api/quran/surah/:nomor", async (req, res) => {
    try {
      const { nomor } = req.params;
      const response = await fetch(`https://api.quran.gading.dev/surah/${nomor}`);
      if (!response.ok) throw new Error(`Gagal mengambil detail surah nomor ${nomor}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Get Quran Surah Tafsir (EQuran v2 API)
  app.get("/api/equran/surat", async (req, res) => {
    try {
      const response = await fetch("https://equran.id/api/v2/surat");
      if (!response.ok) throw new Error("Gagal mengambil daftar surat");
      res.json(await response.json());
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  app.get("/api/equran/surat/:nomor", async (req, res) => {
    try {
      const { nomor } = req.params;
      const response = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
      if (!response.ok) throw new Error(`Gagal mengambil detail surat nomor ${nomor}`);
      res.json(await response.json());
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  app.get("/api/equran/tafsir/:nomor", async (req, res) => {
    try {
      const { nomor } = req.params;
      const response = await fetch(`https://equran.id/api/v2/tafsir/${nomor}`);
      if (!response.ok) throw new Error(`Gagal mengambil tafsir surah nomor ${nomor}`);
      res.json(await response.json());
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Reverse Geocode
  app.get("/api/ext/reverse-geocode", async (req, res) => {
    try {
      const q = new URLSearchParams(req.query as Record<string, string>).toString();
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${q}`);
      if (!response.ok) throw new Error("Gagal mengambil alokasi geocode");
      res.json(await response.json());
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Aladhan Timings
  app.get("/api/ext/aladhan/timings/:date", async (req, res) => {
    try {
      const q = new URLSearchParams(req.query as Record<string, string>).toString();
      const response = await fetch(`https://api.aladhan.com/v1/timings/${req.params.date}?${q}`);
      if (!response.ok) throw new Error("Gagal");
      res.json(await response.json());
    } catch (error: any) {
       res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Aladhan Calendar
  app.get("/api/ext/aladhan/calendar/:month/:year", async (req, res) => {
    try {
      const response = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${req.params.month}/${req.params.year}`);
      if (!response.ok) throw new Error("Gagal");
      res.json(await response.json());
    } catch (error: any) {
       res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Hadith
  app.get("/api/ext/hadith/books", async (req, res) => {
    try {
      const response = await fetch("https://hadis-api-id.vercel.app/hadith");
      if (!response.ok) throw new Error("Gagal mengambil data perawi");
      const data = await response.json();
      
      const formattedData = data.map((perawi: any) => ({
        id: perawi.slug,
        name: perawi.name,
        available: perawi.total
      }));
      
      res.json({ code: 200, data: formattedData });
    } catch (error: any) {
       res.status(500).json({ status: false, message: error.message });
    }
  });

  app.get("/api/ext/hadith/books/:id", async (req, res) => {
    try {
      const rangeParams = (req.query as Record<string, string>).range as string;
      let start = 1;
      let end = 50;
      if (rangeParams) {
        const parts = rangeParams.split('-');
        if (parts.length === 2) {
          start = parseInt(parts[0], 10) || 1;
          end = parseInt(parts[1], 10) || 50;
        }
      }
      
      const { id } = req.params;
      
      const limit = end - start + 1;
      const page = Math.floor((start - 1) / limit) + 1;
      
      const response = await fetch(`https://hadis-api-id.vercel.app/hadith/${id}?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error("Gagal mengambil data hadits");
      const data = await response.json();
      
      const hadiths = (data.items || []).map((i: any) => ({
         number: i.number,
         arab: i.arab,
         id: i.id
      }));
      
      res.json({
         code: 200,
         data: { id, hadiths }
      });
    } catch (error: any) {
       res.status(500).json({ status: false, message: error.message });
    }
  });

  // API Route - Generate Khutbah
  app.post("/api/generate-khutbah", async (req, res) => {
    try {
      const { tema, judul, apiKey, tanyaUstadzContext } = req.body;
      let client = getGeminiClient();
      
      if (apiKey && apiKey.trim() !== "") {
        try {
          client = new GoogleGenAI({ apiKey: apiKey.trim() });
        } catch (e) {
          // Fall back to deafult
        }
      }

      if (!client) {
        return res.status(401).json({ error: "API Key diperlukan. Silakan atur di Pengaturan." });
      }

      const promptText = `
Anda adalah seorang ulama tingkat tinggi dan penulis naskah Khutbah Jumat profesional di Indonesia.
Tugas Anda: Buatkan naskah Khutbah Jumat yang lengkap, mendalam, dan terstruktur sesuai sunnah dengan tema: "${tema}" ${judul ? `(Judul: ${judul})` : ''}.
${tanyaUstadzContext ? `\nRiwayat percakapan jamaah sebelumnya mengenai topik ini:\n"${tanyaUstadzContext}"\nSilakan jadikan riwayat pertanyaan dan jawaban tersebut sebagai landasan cerita atau bahasan utama dalam isi khutbah Anda.\n` : ""}
Pastikan panjangnya cukup untuk khutbah nyata (sekitar 10-15 menit dibaca). Gunakan bahasa Indonesia yang baku, menyentuh hati, namun tegas.

Struktur Output JSON yang HARUS dikembalikan persis seperti ini:
{
  "title": "Judul Khutbah (Singkat dan Menarik)",
  "author": "AI Ustadz / Nama Anda",
  "tema": "Topik ringkas (Maksimal 2-3 kata)",
  "ringkasan": "Satu kalimat ringkasan",
  "muqaddimah": "الْحَمْدُ لِلَّهِ الَّذِي... (Teks Arab lengkap Muqaddimah: memuat Tahmid, Shalawat, Syahadat, dan Wasiat Takwa)",
  "content": [
    // Array dari block konten. Kombinasikan "text" (paragraf narasi), "quran" (ayat), "hadith" (hadis), "points" (poin-poin pesan), dan selalu diakhiri dengan "doa" (doa bahasa Indonesia di akhir khutbah pertama).
  ],
  "penutup": "بَارَكَ اللهُ لِيْ وَلَكُمْ فِي الْقُرْآنِ الْعَظِيْمِ... (Teks Arab lengkap Penutup / Khutbah Kedua)"
}

Untuk "content", struktur block yang diijinkan adalah:
1. Text biasa: { "type": "text", "text": "Paragraf narasi khutbah yang mendalam..." }
2. Kutipan Qur'an: { "type": "quran", "arabic": "tulisan arab ayat", "translation": "terjemahan", "source": "QS. Nama Surat: Ayat" }
3. Kutipan Hadis: { "type": "hadith", "arabic": "tulisan arab hadis", "translation": "terjemahan", "source": "HR. Sesuatu" }
4. Poin-poin/Penjelasan: { "type": "points", "intro": "Berikut adalah kiat-kiat:", "items": [ { "title": "1. Poin Satu", "desc": "Penjelasan" } ] }
5. Doa Penutup Khutbah Pertama: { "type": "doa", "text": "Ya Allah, jadikanlah kami..." }

PENTING:
- Di dalam array "content", HARUS memuat minimal 2-3 dalil (Quran/Hadis).
- Di akhir array "content", SELALU letakkan block "doa" yang berisi doa merenung/intropeksi berbahasa Indonesia untuk menutup khutbah pertama sebelum duduk di antara dua khutbah.
- Kembalikan HANYA JSON. Jangan gunakan markdown block (\`\`\`json).`;

      const response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from AI");
      }

      // the response is guaranteed to be JSON string due to responseMimeType
      let parsedKhutbah;
      try {
        parsedKhutbah = JSON.parse(responseText);
      } catch (err) {
        throw new Error("Gagal mengurai format JSON dari AI.");
      }

      // Pastikan ada ID dan property lain
      parsedKhutbah.id = Date.now();
      
      res.json(parsedKhutbah);
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Terjadi kesalahan saat membuat khutbah." });
    }
  });

  // API Route - Ask AI Scholar about verse or spiritual guidance
  app.post("/api/ask-ai", async (req, res) => {
    try {
      const { prompt, verseText, context, apiKey } = req.body;
      let client = getGeminiClient();
      
      if (apiKey && apiKey.trim() !== "") {
        try {
          client = new GoogleGenAI({ apiKey: apiKey.trim() });
        } catch (e) {
          console.error("Failed to initialize Google Gen AI with custom key", e);
        }
      }

      if (!client) {
        return res.status(403).json({
          status: false,
          message: "Gemini API Key belum ditentukan. Harap tambahkan API Key secara mandiri melalui menu Pengaturan Profil.",
          isConfigured: false
        });
      }

      const queryPrompt = `
Konteks: ${context || "Tanya Umum tentang Al-Qur'an"}
${verseText ? `Ayat Al-Qur'an Yang Sedang Dibahas:\n"${verseText}"` : ""}

Pertanyaan Pengguna:
${prompt}

Tolong jawab pertanyaan ini dengan hikmah, berikan referensi spesifik dari Al-Qur'an maupun sabda Rasulullah (Hadits) yang relevan secara tegas beserta porsi teks asli dan maknanya agar menguatkan keimanan. Pastikan mencantumkan nama Surah dan nomor ayat (misal: QS. Al-Baqarah: 255) atau perawi Hadits (misal: HR. Bukhari).
`;

      let retries = 2;
      let finalResponse = null;
      let lastError = null;

      while (retries > 0) {
        try {
          finalResponse = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: queryPrompt,
            config: {
              systemInstruction: "Anda adalah asisten AI 'Tanya Ustadz AI' di dalam aplikasi 'Quran Saku'. Anda adalah seorang Ulama Mufassir yang sangat berpengetahuan tentang Al-Qur'an, asbabun nuzul, serta ilmu Hadits. Tugas Anda adalah: memberikan jawaban Islami secara komprehensif yang WAJIB merujuk pada ayat-ayat suci Al-Qur'an dan juga menyertakan riwayat Hadits yang selaras (Kutubus Sittah) dalam menjawab isu umat. Di setiap jawaban yang melibatkan saran, doa, atau dalil, berikan kutipan bahasa Arab, terjemahan Indonesia, serta referensi letaknya (contoh: QS. Al-Baqarah: 120 atau HR. Bukhari). Formatlah teks menggunakan Markdown dengan rapi."
            }
          });
          break; // Success, exit loop
        } catch (error: any) {
          lastError = error;
          if (error.message?.includes("503") || error.message?.includes("high demand")) {
            retries--;
            if (retries > 0) {
              console.log("503 High Demand hit. Retrying in 1.5 seconds...");
              await new Promise(res => setTimeout(res, 1500));
            }
          } else {
            throw error; // If it's a different error, throw immediately
          }
        }
      }

      if (!finalResponse && lastError) {
        throw lastError; // If all retries failed
      }

      res.json({
        status: true,
        answer: finalResponse?.text || "",
        isConfigured: true
      });
    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = error.message;
      if (errorMsg?.includes("high demand") || errorMsg?.includes("503")) {
        errorMsg = "Server Google Gemini saat ini sedang sibuk dan mengalami permintaan tinggi (503). Mohon coba beberapa saat lagi.";
      }
      res.status(500).json({ status: false, message: errorMsg });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", url: req.url, originalUrl: req.originalUrl, path: req.path });
  });

  app.get("/debug-url", (req, res) => {
    res.json({ url: req.url, originalUrl: req.originalUrl, path: req.path });
  });

  // Support Vite dev middleware or serve compiled production bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html globally for react router pathways
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Quran Saku] Fullstack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
