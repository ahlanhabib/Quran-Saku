import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  Copy,
  Share2,
  Download,
  Volume2,
  MoreHorizontal
} from "lucide-react";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface TanyaUstadzViewProps {
  onBack?: () => void;
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification"
  ) => void;
  geminiApiKey?: string;
}

export const TanyaUstadzView: React.FC<TanyaUstadzViewProps> = ({
  onBack,
  addToast,
  geminiApiKey,
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
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

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
    addToast("Menyiapkan PDF...", "Harap tunggu, memproses halaman.", "info");

    const rootContainer = document.createElement("div");
    rootContainer.style.position = "absolute";
    rootContainer.style.left = "-9999px";
    rootContainer.style.top = "0";
    rootContainer.style.width = "650px";
    rootContainer.style.backgroundColor = "#FDFBF7";
    rootContainer.style.fontFamily = "sans-serif";
    rootContainer.style.color = "#334155";
    document.body.appendChild(rootContainer);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      let currentY = margin;

      // Render Header
      const headerDiv = document.createElement("div");
      headerDiv.style.padding = "25px";
      headerDiv.style.textAlign = "center";
      headerDiv.style.borderBottom = "2px solid rgba(15, 76, 58, 0.1)";
      headerDiv.style.marginBottom = "20px";
      headerDiv.innerHTML = `
        <h1 style="margin: 0; font-size: 26px; font-weight: bold; color: #0F4C3A; font-family: serif;">Tanya Ustadz AI - Quran Saku</h1>
        <p style="margin: 5px 0 0; font-size: 13px; color: #64748b;">Diterbitkan otomatis pada: ${new Date(timestamp).toLocaleString('id-ID')}</p>
      `;
      rootContainer.appendChild(headerDiv);
      
      let canvas = await html2canvas(headerDiv, { scale: 2 });
      let imgData = canvas.toDataURL("image/png");
      let imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, currentY, pdfWidth, imgHeight);
      currentY += imgHeight + 5;
      
      // Render Paragraphs chunks
      const blocks = text.split('\n\n').filter(b => b.trim());
      
      for (const block of blocks) {
        // If a block is extremely long (like a long list), split it further by single line breaks
        const subBlocks = block.split('\n').length > 8 ? block.split('\n').filter(b => b.trim()) : [block];

        for (const subBlock of subBlocks) {
          const blockDiv = document.createElement("div");
          blockDiv.style.padding = "4px 35px";
          blockDiv.style.fontSize = "15px";
          blockDiv.style.lineHeight = "1.7";
          blockDiv.style.whiteSpace = "pre-wrap";
          
          let formatted = subBlock.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          formatted = formatted.replace(/\*(.*?)\*/g, '<i>$1</i>');
          formatted = formatted.replace(/### (.*?)$/g, '<h3 style="margin: 10px 0 5px; color:#0F4C3A;">$1</h3>');
          
          blockDiv.innerHTML = formatted;
          rootContainer.appendChild(blockDiv);
          
          const bCanvas = await html2canvas(blockDiv, { scale: 2 });
          const bImgData = bCanvas.toDataURL("image/png");
          const bHeight = (bCanvas.height * pdfWidth) / bCanvas.width;
          
          // Check for page break
          if (currentY + bHeight > pdfHeight - margin - 15) { // 15 reserve for footer
            pdf.addPage();
            currentY = margin;
          }
          
          pdf.addImage(bImgData, "PNG", 0, currentY, pdfWidth, bHeight);
          currentY += bHeight;
          
          rootContainer.removeChild(blockDiv);
        }
        // Add spacing after paragraph
        currentY += 4;
      }

      // Render Footer
      const footerDiv = document.createElement("div");
      footerDiv.style.padding = "25px";
      footerDiv.style.marginTop = "30px";
      footerDiv.style.textAlign = "center";
      footerDiv.style.fontSize = "12px";
      footerDiv.style.color = "#94a3b8";
      footerDiv.style.borderTop = "1px solid rgba(15, 76, 58, 0.05)";
      footerDiv.innerHTML = "<b>Quran Saku</b> &mdash; Semoga jawaban ini menjadi ilmu yang bermanfaat. Teruslah istiqamah.";
      rootContainer.appendChild(footerDiv);

      canvas = await html2canvas(footerDiv, { scale: 2 });
      imgData = canvas.toDataURL("image/png");
      imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (currentY + imgHeight > pdfHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.addImage(imgData, "PNG", 0, currentY, pdfWidth, imgHeight);

      pdf.save("TanyaUstadzAI-Document.pdf");
      addToast("Sukses", "PDF Ustadz AI berhasil diunduh.", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal", "Gagal merender PDF.", "warning");
    } finally {
      document.body.removeChild(rootContainer);
    }
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      // Clean text slightly from markdown standard chars to improve TTS reading
      const cleanText = text.replace(/[*_#]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "id-ID";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
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

        <button
          onClick={handleClearChat}
          className="shrink-0 text-[10px] sm:text-xs text-[#ECC17A] hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all cursor-pointer whitespace-nowrap mt-2"
        >
          Hapus Obrolan
        </button>
      </div>

      {/* Scrolling Chat Area */}
      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto p-5 pb-8 flex flex-col gap-4 bg-[#FDFBF7] relative scroll-smooth">
        {messages.map((msg, i) => {
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
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
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

          <div className="flex gap-3 items-end">
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
    </div>
  );
};
