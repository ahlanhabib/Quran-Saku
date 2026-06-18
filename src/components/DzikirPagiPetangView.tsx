import { PageContainer } from "./PageContainer";
import React, { useState } from "react";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DzikirPagiPetangViewProps {
  onBack: () => void;
  addToast: (title: string, body: string, type: "success" | "info" | "warning" | "notification") => void;
}

const dzikirData = [
  {
    id: 1,
    arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    latin: "Aku berlindung kepada Allah dari godaan syaitan yang terkutuk.",
    targetCount: 1,
  },
  {
    id: 2,
    arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...",
    latin: "Ayat Kursi",
    targetCount: 1,
  },
  {
    id: 3,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ اللَّهُ أَحَدٌ...",
    latin: "Surat Al-Ikhlas",
    targetCount: 3,
  },
  {
    id: 4,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...",
    latin: "Surat Al-Falaq",
    targetCount: 3,
  },
  {
    id: 5,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ بِرَبِّ النَّاسِ...",
    latin: "Surat An-Nas",
    targetCount: 3,
  },
  {
    id: 6,
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    latin: "Bismillahilladzi la yadhurru ma'asmihi syai'un fil ardhi wa laa fis sama'i wa huwas sami'ul 'alim",
    targetCount: 3,
  }
];

export const DzikirPagiPetangView: React.FC<DzikirPagiPetangViewProps> = ({ onBack, addToast }) => {
  const [type, setType] = useState<"pagi" | "petang">("pagi");
  const [counts, setCounts] = useState<{ [key: number]: number }>({});

  const incrementCount = (id: number, target: number) => {
    setCounts((prev) => {
      const current = prev[id] || 0;
      if (current < target) {
        if (current + 1 === target) {
          addToast("Alhamdulillah", "Bacaan dzikir selesai", "success");
        }
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
        return { ...prev, [id]: current + 1 };
      }
      return prev;
    });
  };

  const resetAll = () => {
    setCounts({});
  };

  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-serif font-bold text-lg text-[#0F4C3A]">Al-Ma'tsurat</h2>
      </div>

      <div className="p-5 max-w-2xl mx-auto w-full">
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            onClick={() => { setType("pagi"); resetAll(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition cursor-pointer ${
              type === "pagi" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Sun className="w-4 h-4" /> Dzikir Pagi
          </button>
          <button
            onClick={() => { setType("petang"); resetAll(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition cursor-pointer ${
              type === "petang" ? "bg-slate-800 text-indigo-300 shadow-sm" : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Moon className="w-4 h-4" /> Dzikir Petang
          </button>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {dzikirData.map((item) => {
              const current = counts[item.id] || 0;
              const isDone = current >= item.targetCount;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-3xl p-6 shadow-sm border transition-colors ${
                    isDone ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100"
                  }`}
                >
                  <p className="font-serif text-2xl leading-loose text-right text-[#0F4C3A] mb-4" dir="rtl">
                    {item.arabic}
                  </p>
                  <p className="text-sm text-slate-600 mb-6">
                    {item.latin}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm font-bold text-slate-500">
                      {current} / {item.targetCount}
                    </span>
                    <button
                      disabled={isDone}
                      onClick={() => incrementCount(item.id, item.targetCount)}
                      className={`px-8 py-3 rounded-2xl font-bold transition-all cursor-pointer ${
                        isDone
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-[#0F4C3A] text-white hover:bg-[#0c3e2f] active:scale-95 shadow-md shadow-emerald-900/20"
                      }`}
                    >
                      {isDone ? "Selesai" : "Baca"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
};
