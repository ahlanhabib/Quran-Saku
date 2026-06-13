import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  Copy,
  Share2,
  Download,
  Volume2,
  MoreHorizontal,
  X,
  Mic,
  MicOff,
  Bookmark,
  Image as ImageIcon,
  BookOpen
} from "lucide-react";
import { STATIC_SURAHS } from "../data";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  isBookmarked?: boolean;
}

interface TanyaUstadzViewProps {
  onBack?: () => void;
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification"
  ) => void;
  geminiApiKey?: string;
  onNavigateToSurahAyah?: (surah: number, ayat: number) => void;
}

const processTextForQuranLinks = (rawText: string) => {
  return rawText.replace(/QS\.\s*([A-Za-z-'\s]+):\s*(\d+)(?:-\d+)?/gi, (match, surahName, ayatNumber) => {
    // Normalization handles prefixes like "Ali 'Imran", removes spaces/punctuation for flexible matching
    const searchName = surahName.trim().toLowerCase().replace(/[^a-z]/g, "");
    const matchedSurah = STATIC_SURAHS.find(
      (s) => s.namaLatin.toLowerCase().replace(/[^a-z]/g, "") === searchName || s.nama.toLowerCase().replace(/[^a-z]/g, "") === searchName
    );
    if (matchedSurah) {
      return `[${match}](#goto-quran-${matchedSurah.nomor}-${ayatNumber})`;
    }
    return match;
  });
};

export const TanyaUstadzView: React.FC<TanyaUstadzViewProps> = ({
  onBack,
  addToast,
  geminiApiKey,
  onNavigateToSurahAyah,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("tanyaUstadzHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        sender: "ai",
        text: "Assalamu'alaikum! Saya adalah Asisten AI 'Tanya Ustadz AI' di Quran Saku Anda. Silakan tanyakan apa saja tentang kandungan ayat, nasehat spiritual, tafsir makna, maupun petunjuk doa yang ingin Anda ketahui.",
        timestamp: new Date(),
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("tanyaUstadzHistory", JSON.stringify(messages));
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const suggestedPrompts = [
    "Makna ketenangan jiwa dalam surat Al-Ra'd",
    "Tafsir keutamaan membaca Surat Al-Kahfi di hari Jumat",
    "Ayat Quran tentang sabar menghadapi ujian hidup",
    "Rekomendasi doa untuk kelancaran mencari rezeki halal",
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "id-ID";

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setInputValue((prev) => (prev ? prev + " " + finalTranscript : finalTranscript));
          } else if (interimTranscript) {
             // For a better UX we could show interim, but for now just appending final is safer
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          addToast("Informasi", "Mikrofon dihentikan atau tidak diizinkan.", "notification");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [addToast]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
         try {
           recognitionRef.current.start();
           setIsListening(true);
           addToast("Mendengarkan...", "Silakan mulai berbicara.", "info");
         } catch (e) {
           console.error(e);
           addToast("Error", "Gagal memulai mikrofon.", "warning");
         }
      } else {
         addToast("Tidak Didukung", "Browser Anda tidak mendukung fitur Voice Input.", "warning");
      }
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsSending(true);

    try {
      let aiText = "";

      if (geminiApiKey && geminiApiKey.trim() !== "") {
        const sysInstruct =
          "Anda adalah asisten AI 'Tanya Ustadz AI' di dalam aplikasi 'Quran Saku'. Anda adalah seorang Ulama Mufassir yang sangat berpengetahuan tentang Al-Qur'an, asbabun nuzul, serta ilmu Hadits. Tugas Anda adalah: memberikan jawaban Islami secara komprehensif yang WAJIB merujuk pada ayat-ayat suci Al-Qur'an dan juga menyertakan riwayat Hadits yang selaras (Kutubus Sittah) dalam menjawab isu umat. Di setiap jawaban yang melibatkan saran, doa, atau dalil, berikan kutipan bahasa Arab, terjemahan Indonesia, serta referensi letaknya (contoh: QS. Al-Baqarah: 120 atau HR. Bukhari). Formatlah teks menggunakan Markdown dengan rapi.";

        const qp = `Pertanyaan Pengguna:\n${textToSend}\n\nTolong jawab pertanyaan ini dengan hikmah, berikan referensi spesifik dari Al-Qur'an maupun sabda Rasulullah (Hadits) yang relevan secara tegas beserta porsi teks asli dan maknanya agar menguatkan keimanan.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sysInstruct }] },
              contents: [{ role: "user", parts: [{ text: qp }] }],
            }),
          }
        );

        if (!response.ok)
          throw new Error(
            `Google API: ${response.status} ${response.statusText}`
          );
        const payload = await response.json();

        aiText =
          payload.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Maaf, Ustadz AI tidak dapat menemukan jawaban referensi.";
      } else {
        const response = await fetch("/api/ask-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: textToSend }),
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          throw new Error(
            "API backend Express tidak ditemukan (Ini wajar jika Anda mendeploy di Vercel Static, karena Vercel bukan server Express). Solusi: Cukup tambahkan Kunci API Gemini Anda di menu Pengaturan Profil untuk langsung menggunakan koneksi tanpa server (Serverless)."
          );
        }

        const payload = await response.json();
        if (payload.status && payload.answer) {
          aiText = payload.answer;
        } else {
          throw new Error(
            payload.message || "Gagal berkomunikasi dengan asisten AI."
          );
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiText,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      
      const isOverloaded = err.message?.includes("high demand") || err.message?.includes("503");
      const errorMsg = isOverloaded
        ? "**Ustadz AI Sedang Sibuk:**\nMaaf, sistem AI Ustadz saat ini sedang mengalami lonjakan antrean. Mohon tunggu beberapa menit lalu coba tanyakan kembali ya. Insya Allah segera membaik. (Status: 503 Server Sibuk)"
        : `**Maaf, saya mengalami kendala interaksi:** ${err.message}`;

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: errorMsg,
          timestamp: new Date(),
        },
      ]);
      addToast(
        "AI Sedang Sibuk",
        isOverloaded ? "Server sedang padat, silakan coba lagi." : "Harap periksa pengaturan pengaturan.",
        "warning"
      );
    } finally {
      setIsSending(false);
    }
  };

  const toggleBookmark = (indexToSelect: number) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[indexToSelect] = { 
        ...newMessages[indexToSelect], 
        isBookmarked: !newMessages[indexToSelect].isBookmarked 
      };
      return newMessages;
    });
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: "ai",
        text: "Pesan obrolan tadabbur dibersihkan. Tanyakan petunjuk Al-Qur'an dan bimbingan rohani yang Anda butuhkan kembali.",
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem("tanyaUstadzHistory");
    addToast("Obrolan Dihapus", "Riwayat dialog dibersihkan.", "info");
  };

  const handleExportPdf = async (text: string, timestamp: Date) => {
    setIsGeneratingPdf(true);
    addToast("Menyiapkan Pratinjau...", "Harap tunggu, memproses halaman dokumen.", "info");

    try {
      // Clean non-printable control characters
      const cleanText = text.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "");

      let formattedContent = "";
      const blocks = cleanText.split('\n\n').filter(b => b.trim());

      for (let block of blocks) {
        block = block.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').replace(/`/g, '').trim();
        if (!block) continue;

        let blockContent = "";
        let arabicLineCount = 0;
        
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

        for (let line of lines) {
          line = line.replace(/^\s*[-*]\s+/, '• ');

          let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<i>$1</i>');
          formattedLine = formattedLine.replace(/### (.*?)$/g, '<h3>$1</h3>');
          formattedLine = formattedLine.replace(/## (.*?)$/g, '<h2>$1</h2>');
          formattedLine = formattedLine.replace(/# (.*?)$/g, '<h1>$1</h1>');

          const arabicChars = line.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || [];
          const allLetters = line.replace(/[^a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, '');
          const isLineArabic = allLetters.length > 0 && (arabicChars.length / allLetters.length) > 0.4;
          
          if (isLineArabic) {
            arabicLineCount++;
            blockContent += `<div dir="rtl" class="arabic-line">${formattedLine}</div>`;
          } else {
            // Mixed line: wrap arabic chunks in <bdi>
            const arabicRegexChunk = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s،؛؟.\-"'()\[\]{}0-9]+)/g;
            formattedLine = formattedLine.replace(arabicRegexChunk, (match) => {
              if (/[\u0600-\u06FF]/.test(match)) {
                 return `<bdi dir="rtl" class="arabic-inline">${match}</bdi>`;
              }
              return match;
            });
            blockContent += `<div class="text-line">${formattedLine}</div>`;
          }
        }

        const isOverallArabic = arabicLineCount > (lines.length / 2);
        const blockClass = isOverallArabic ? "content-block arabic-block" : "content-block";
        formattedContent += `<div class="${blockClass}">${blockContent}</div>`;
      }

      const htmlDoc = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Tanya Ustadz AI - Quran Saku</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 20mm 20mm 25mm 20mm;
              @bottom-center {
                content: "Halaman " counter(page) " dari " counter(pages);
                font-family: 'Inter', sans-serif;
                font-size: 10pt;
                color: #94a3b8;
              }
            }
            
            body {
              font-family: 'Inter', sans-serif;
              color: #334155;
              line-height: 1.7;
              font-size: 11pt;
              margin: 0;
              padding: 0;
              background-color: white;
            }

            .print-container {
              display: block;
              margin: 0 auto;
            }

            .header {
              text-align: center;
              padding-bottom: 20px;
              margin-bottom: 25px;
              border-bottom: 2px solid rgba(15, 76, 58, 0.1);
            }

            .header .logo {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              background: #0F4C3A;
              color: #ECC17A;
              border-radius: 12px;
              margin-bottom: 15px;
            }

            .header .logo svg {
              width: 28px;
              height: 28px;
            }

            .header h1 {
              margin: 0;
              font-size: 24pt;
              color: #0F4C3A;
              font-family: serif;
              letter-spacing: -0.5px;
            }

            .header p {
              margin: 6px 0 0;
              font-size: 10pt;
              color: #64748b;
            }

            .content {
              padding: 0 10mm;
            }

            .content-block {
              margin-bottom: 16px;
              padding: 12px 18px;
              background-color: #F8FAFC;
              border-radius: 12px;
              border: 1px solid #E2E8F0;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .arabic-block {
              direction: rtl;
              text-align: right;
              background-color: #F5FBF9;
              border-color: #D1EAE1;
            }

            .text-line {
              margin-bottom: 6px;
            }
            .text-line:last-child {
              margin-bottom: 0;
            }

            .arabic-line {
              text-align: right;
              direction: rtl;
              font-family: 'Scheherazade New', 'Noto Sans Arabic', 'Amiri', serif;
              font-size: 1.8em;
              line-height: 1.8;
              color: #0F4C3A;
              padding: 6px 0;
            }

            .arabic-inline {
              direction: rtl;
              unicode-bidi: isolate;
              font-family: 'Scheherazade New', 'Noto Sans Arabic', 'Amiri', serif;
              font-size: 1.6em;
              line-height: normal;
              color: #0F4C3A;
              padding: 0 4px;
            }

            h1, h2, h3 {
              margin: 0 0 8px;
              color: #0F4C3A;
              font-size: 13pt;
              font-weight: 600;
            }

            .footer-note {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid rgba(15, 76, 58, 0.1);
              text-align: center;
              font-size: 9pt;
              color: #94a3b8;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            @media print {
              body {
                background: transparent;
              }
              .content-block {
                box-shadow: none;
              }
              .print-container {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div id="print-preparation" class="print-container">
            <div class="header">
              <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
              </div>
              <h1>Quran Saku</h1>
              <p>Jawaban AI "Tanya Ustadz" &mdash; Diterbitkan otomatis pada: ${new Date(timestamp).toLocaleString('id-ID')}</p>
            </div>
            
            <div class="content">
              ${formattedContent}
            </div>

            <div class="footer-note">
              <strong>Quran Saku</strong> &mdash; Semoga jawaban ini menjadi ilmu yang bermanfaat. Teruslah istiqamah.
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlDoc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      addToast("Sukses", "Pratinjau PDF berhasil dibuat.", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal", "Gagal merender PDF.", "warning");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportImage = async (text: string, timestamp: Date) => {
    addToast("Membuat Gambar...", "Mempersiapkan kutipan gambar.", "info");
    const rootContainer = document.createElement("div");
    rootContainer.style.position = "absolute";
    rootContainer.style.left = "-9999px";
    rootContainer.style.top = "0";
    rootContainer.style.width = "1080px";
    rootContainer.style.backgroundColor = "#0F4C3A";
    rootContainer.style.color = "#FFFFFF";
    rootContainer.style.padding = "80px";
    rootContainer.style.fontFamily = "sans-serif";
    rootContainer.style.boxSizing = "border-box";
    
    const cleanText = text.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "").replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').replace(/`/g, '');
    let lines = cleanText.split('\n').filter(l => l.trim().length > 0);
    
    if (lines.length > 7) {
      lines = lines.slice(0, 7);
      lines.push("...");
    }

    let htmlContent = "";
    for (let line of lines) {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/### (.*?)$/g, '<strong>$1</strong>');
      const arabicChars = line.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || [];
      const allLetters = line.replace(/[^a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, '');
      const isLineArabic = allLetters.length > 0 && (arabicChars.length / allLetters.length) > 0.4;
      if (isLineArabic) {
        htmlContent += `<div class="img-arabic">${formattedLine}</div>`;
      } else {
        htmlContent += `<div style="margin-bottom: 24px;">${formattedLine}</div>`;
      }
    }

    rootContainer.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
        .img-content { font-family: 'Inter', sans-serif; font-size: 34px; line-height: 1.6; }
        .img-arabic { font-family: 'Scheherazade New', 'Noto Sans Arabic', 'Amiri', serif; font-size: 60px; line-height: 1.8; direction: rtl; text-align: right; color: #ECC17A; margin: 30px 0; }
        .img-footer { margin-top: 60px; border-top: 2px solid rgba(236, 193, 122, 0.3); padding-top: 40px; display: flex; justify-content: space-between; align-items: center; }
        .img-footer-brand { font-size: 36px; font-weight: bold; color: #ECC17A; font-family: serif; margin-bottom: 8px; }
        .img-footer-sub { font-size: 24px; color: rgba(255,255,255,0.7); }
      </style>
      <div class="img-content">
        ${htmlContent}
      </div>
      <div class="img-footer">
        <div>
           <div class="img-footer-brand">Quran Saku</div>
           <div class="img-footer-sub">Tanya Ustadz AI &mdash; ${new Date(timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ECC17A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>
      </div>
    `;
    document.body.appendChild(rootContainer);

    try {
      const canvas = await html2canvas(rootContainer, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = "TanyaUstadzAI-Kutipan.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Sukses", "Gambar kutipan berhasil diunduh.", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal", "Gagal merender gambar.", "warning");
    } finally {
      document.body.removeChild(rootContainer);
    }
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, "");
      
      const arabicRegex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s،؛؟]+)/g;
      const chunks = cleanText.split(arabicRegex).filter((c) => c.trim().length > 0);

      chunks.forEach((chunk) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        if (/[\u0600-\u06FF]/.test(chunk)) {
          utterance.lang = "ar-SA";
          utterance.rate = 0.8;
        } else {
          utterance.lang = "id-ID";
          utterance.rate = 0.95;
        }
        window.speechSynthesis.speak(utterance);
      });
      addToast("Membacakan Jawaban", "Asisten AI membaca rujukan...", "info");
    } else {
      addToast("Fitur Tidak Didukung", "Browser Anda tidak mendukung Web Speech API.", "warning");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-[100dvh] z-[35] bg-[#FDFBF7] flex flex-col pb-[115px] md:pb-[125px]">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-[#0F4C3A] to-emerald-950 z-20 px-5 pt-6 pb-4 sm:pt-8 flex items-center justify-between gap-4 shadow-sm border-b border-emerald-900/50 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 hover:scale-105 rounded-full cursor-pointer transition-all shrink-0 mt-2"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 min-w-0 mt-2">
            <div className="p-2 bg-white/10 rounded-xl shrink-0">
              <Bot className="w-5 h-5 text-[#ECC17A]" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-serif font-bold text-white text-lg leading-tight truncate">
                Tanya Ustadz AI
              </h3>
              <p className="text-[10px] text-teal-100/90 font-medium leading-normal line-clamp-1">
                Tanya dalil, ayat, & hadits (Gemini 2.5 Flash)
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center mt-2 shrink-0">
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${showBookmarksOnly ? "bg-[#ECC17A] text-[#0F4C3A]" : "bg-white/5 text-[#ECC17A] hover:bg-white/10"}`}
            title="Filter Bookmark Jawaban"
          >
            <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? "fill-[#0F4C3A]" : ""}`} />
            {showBookmarksOnly ? "Semua" : "Bookmark"}
          </button>
          <button
            onClick={handleClearChat}
            className="shrink-0 text-[10px] sm:text-xs text-[#ECC17A] hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            Hapus
          </button>
        </div>
      </div>

      {/* Scrolling Chat Area */}
      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto p-5 pb-8 flex flex-col gap-4 bg-[#FDFBF7] relative scroll-smooth">
        {showBookmarksOnly && messages.filter(m => m.isBookmarked).length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Belum ada jawaban yang di-bookmark.
          </div>
        )}
        {(showBookmarksOnly ? messages.filter(m => m.isBookmarked) : messages).map((msg, index) => {
          const i = messages.findIndex(orig => orig === msg);
          const isAi = msg.sender === "ai";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 max-w-[95%] sm:max-w-[85%] ${
                isAi ? "self-start" : "self-end flex-row-reverse"
              }`}
            >
              <div
                className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center flex-shrink-0 mt-1 ${
                  isAi
                    ? "bg-emerald-100/50 border border-emerald-200/50 text-[#0F4C3A]"
                    : "bg-slate-200 border border-slate-300/50 text-slate-700"
                }`}
              >
                {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div className="flex flex-col gap-1 w-full min-w-0">
                <div
                  className={`p-4 rounded-[20px] text-[13px] sm:text-sm leading-relaxed select-text shadow-sm border overflow-x-auto ${
                    isAi
                      ? "bg-white border-slate-100 text-slate-800 rounded-tl-sm"
                      : "bg-[#0F4C3A] border-[#0F4C3A] text-white rounded-tr-sm whitespace-pre-wrap"
                  }`}
                >
                  {isAi ? (
                    <div className="prose prose-sm prose-slate max-w-none prose-p:leading-normal prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-a:text-[#0F4C3A] break-words">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => {
                            if (props.href && props.href.startsWith("#goto-quran-")) {
                              const [, , , surahNum, ayatNum] = props.href.split("-");
                              return (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (onNavigateToSurahAyah) {
                                      onNavigateToSurahAyah(parseInt(surahNum, 10), parseInt(ayatNum, 10));
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 font-bold text-[#0F4C3A] hover:bg-emerald-50 px-1 rounded transition-colors no-underline"
                                  title="Baca di Al-Qur'an"
                                >
                                  <BookOpen className="w-3.5 h-3.5 inline text-[#ECC17A]" /> 
                                  <span className="underline decoration-emerald-200 underline-offset-4">{props.children}</span>
                                </a>
                              );
                            }
                            return <a {...props} />;
                          }
                        }}
                      >
                        {processTextForQuranLinks(msg.text)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
                <div className={`flex items-center gap-2 px-1 mt-1 ${isAi ? "justify-between w-full" : "justify-end"}`}>
                  {isAi && (
                    <div className="flex items-center gap-1.5 relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleSpeak(msg.text)}
                        title="Baca Jawaban"
                        className="px-2 py-1.5 flex items-center gap-1.5 bg-white border border-slate-200/60 text-slate-500 hover:text-[#0F4C3A] hover:bg-emerald-50 active:bg-emerald-100/50 rounded-lg shadow-sm transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Baca
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          addToast("Disalin", "Jawaban disalin ke clipboard.", "info");
                        }}
                        title="Salin Jawaban"
                        className="px-2 py-1.5 flex items-center gap-1.5 bg-white border border-slate-200/60 text-slate-500 hover:text-[#0F4C3A] hover:bg-emerald-50 active:bg-emerald-100/50 rounded-lg shadow-sm transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Copy className="w-3.5 h-3.5" /> Salin
                      </button>
                      
                      {/* MORE MENU */}
                      <button 
                        onClick={() => toggleBookmark(i)}
                        title={msg.isBookmarked ? "Hapus dari Bookmark" : "Simpan Bookmark"}
                        className={`p-1.5 border border-slate-200/60 rounded-lg shadow-sm transition-all cursor-pointer ${msg.isBookmarked ? 'bg-[#0F4C3A] text-[#ECC17A]' : 'bg-white text-slate-500 hover:bg-emerald-50'}`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setOpenMenuIndex(openMenuIndex === i ? null : i)}
                        title="Opsi Lainnya"
                        className={`p-1.5 border border-slate-200/60 rounded-lg shadow-sm transition-all cursor-pointer ${openMenuIndex === i ? 'bg-emerald-50 text-[#0F4C3A]' : 'bg-white text-slate-500 hover:bg-emerald-50'}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {openMenuIndex === i && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-2 min-w-[140px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-10 flex flex-col gap-0.5"
                          >
                            <button 
                              onClick={() => {
                                handleExportImage(msg.text, msg.timestamp);
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold tracking-wide text-slate-600 hover:text-[#0F4C3A] hover:bg-emerald-50 rounded-lg transition-all cursor-pointer uppercase"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> Brosur Kutipan
                            </button>
                            <button 
                              onClick={() => {
                                handleExportPdf(msg.text, msg.timestamp);
                                setOpenMenuIndex(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold tracking-wide text-slate-600 hover:text-[#0F4C3A] hover:bg-emerald-50 rounded-lg transition-all cursor-pointer uppercase"
                            >
                              <Download className="w-3.5 h-3.5" /> Unduh PDF
                            </button>
                            <button 
                              onClick={async () => {
                                setOpenMenuIndex(null);
                                if (navigator.share) {
                                  try {
                                    await navigator.share({
                                      title: "Tanya Ustadz AI - Quran Saku",
                                      text: msg.text,
                                    });
                                  } catch (e) {
                                    // ignore
                                  }
                                } else {
                                  navigator.clipboard.writeText(msg.text);
                                  addToast("Disalin", "Browser tidak mendukung Share, teks disalin.", "info");
                                }
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold tracking-wide text-slate-600 hover:text-[#0F4C3A] hover:bg-emerald-50 rounded-lg transition-all cursor-pointer uppercase"
                            >
                              <Share2 className="w-3.5 h-3.5" /> Bagikan
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 font-bold tracking-wider opacity-70 shrink-0 self-end mb-1.5">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 self-start max-w-[85%] items-center text-slate-400"
          >
            <div className="p-2 bg-emerald-100/50 rounded-xl h-10 w-10 flex items-center justify-center">
              <Bot className="w-5 h-5 animate-pulse text-[#0F4C3A]" />
            </div>
            <div className="bg-white p-4 rounded-[20px] rounded-tl-none border border-slate-100 text-xs font-semibold flex items-center gap-3 shadow-sm">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C3A] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C3A] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C3A] animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              Ustadz AI sedang memikirkan rujukan dalil...
            </div>
          </motion.div>
        )}
        <div ref={chatBottomRef} className="h-4" />
      </div>

      {/* Input Section (Standard flex order) */}
      <div className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-2 sm:gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] w-full z-10 shrink-0">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">
          {messages.length === 1 && (
            <div className="flex flex-col gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                SARAN PERTANYAAN:
              </span>
              <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-hide">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSendMessage(p)}
                    className="text-[11px] font-bold text-left px-3.5 py-2.5 whitespace-nowrap bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-[#0F4C3A] rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 items-end">
            <button
              onClick={toggleListening}
              disabled={isSending}
              className={`w-12 h-12 shrink-0 rounded-[18px] flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 mb-1 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'}`}
              title={isListening ? "Hentikan Suara" : "Input Suara"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tanyakan penafsiran ayat, tuntunan syariat, atau curhat..."
              disabled={isSending}
              rows={2}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 resize-none shadow-inner"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputValue.trim()}
              className="w-12 h-12 shrink-0 bg-[#0F4C3A] hover:bg-emerald-950 text-[#ECC17A] rounded-[18px] flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 mb-1"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {pdfPreviewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setPdfPreviewUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-700">Pratinjau PDF</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.print();
                      }
                      addToast("Mencetak Document", "Silakan simpan dokumen dari dialog cetak yang muncul.", "info");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F4C3A] text-white hover:bg-emerald-900 rounded-xl transition-all cursor-pointer font-medium text-sm"
                  >
                    <Download className="w-4 h-4 text-[#ECC17A]" /> Unduh PDF
                  </button>
                  <button
                    onClick={() => setPdfPreviewUrl(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-200 p-2 md:p-4 overflow-hidden relative">
                <iframe 
                  id="pdf-preview-iframe"
                  src={pdfPreviewUrl} 
                  className="w-full h-full rounded-lg border-0 shadow-sm bg-white"
                  title="PDF Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
