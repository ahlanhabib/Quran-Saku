import { PageContainer } from "./PageContainer";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Circle, TrendingUp, Download } from "lucide-react";

interface JurnalIbadahViewProps {
  onBack: () => void;
}

export const JurnalIbadahView: React.FC<JurnalIbadahViewProps> = ({ onBack }) => {
  const [tasks, setTasks] = useState<{ id: string; label: string; done: boolean }[]>(() => {
    const cached = localStorage.getItem("qs_jurnal");
    if (cached) {
      // Check if it's from today
      const { date, items } = JSON.parse(cached);
      if (date === new Date().toLocaleDateString()) {
        return items;
      }
    }
    return [
      { id: "subuh", label: "Sholat Subuh Berjamaah", done: false },
      { id: "dzuhur", label: "Sholat Dzuhur Berjamaah", done: false },
      { id: "ashar", label: "Sholat Ashar Berjamaah", done: false },
      { id: "maghrib", label: "Sholat Maghrib Berjamaah", done: false },
      { id: "isya", label: "Sholat Isya Berjamaah", done: false },
      { id: "dhuha", label: "Sholat Dhuha", done: false },
      { id: "tahajud", label: "Sholat Tahajud", done: false },
      { id: "tilawah", label: "Tilawah Al-Qur'an 1 Juz", done: false },
    ];
  });

  useEffect(() => {
    localStorage.setItem(
      "qs_jurnal",
      JSON.stringify({ date: new Date().toLocaleDateString(), items: tasks })
    );
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const progress = Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);

  const handleExport = () => {
    const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let content = `JURNAL IBADAH HARIAN\nTanggal: ${date}\n-----------------------------------\n\n`;
    
    tasks.forEach(t => {
      content += `[${t.done ? "X" : " "}] ${t.label}\n`;
    });
    
    content += `\nPencapaian: ${progress}%\n`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Jurnal_Ibadah_${date.replace(/ /g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-serif font-bold text-lg text-[#0F4C3A]">Jurnal Ibadah</h2>
        </div>
        <button
          onClick={handleExport}
          className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition cursor-pointer"
          title="Ekspor Jurnal"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 max-w-2xl mx-auto w-full">
        <div className="bg-[#0F4C3A] text-white rounded-3xl p-6 mb-6 shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingUp className="w-32 h-32" />
          </div>
          <h3 className="font-serif font-bold text-xl mb-1">Mutaba'ah Yaumiyah</h3>
          <p className="text-emerald-100 text-sm mb-4">
            Catat rutinitas ibadah harianmu untuk menjaga istiqomah.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white/20 h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#ECC17A] h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="font-bold font-mono text-lg">{progress}%</span>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <motion.button
              whileTap={{ scale: 0.98 }}
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                task.done
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`flex-shrink-0 transition-colors ${
                  task.done ? "text-[#0F4C3A]" : "text-slate-300"
                }`}
              >
                {task.done ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </div>
              <span
                className={`flex-1 font-semibold ${
                  task.done ? "text-[#0F4C3A] line-through opacity-70" : "text-slate-700"
                }`}
              >
                {task.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
