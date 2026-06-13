import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // API Route - Get Quran Surah Tafsir
  app.get("/api/quran/tafsir/:nomor", async (req, res) => {
    try {
      const { nomor } = req.params;
      const response = await fetch(`https://api.quran.gading.dev/surah/${nomor}`);
      if (!response.ok) throw new Error(`Gagal mengambil tafsir surah nomor ${nomor}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
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
    res.json({ status: "ok" });
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
