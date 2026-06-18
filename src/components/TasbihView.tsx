import { PageContainer } from "./PageContainer";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  RotateCcw,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Focus,
  ArrowLeft,
} from "lucide-react";

interface TasbihViewProps {
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
  onBack?: () => void;
}

export const TasbihView: React.FC<TasbihViewProps> = ({ addToast, onBack }) => {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    const savedCount = localStorage.getItem("qs_tasbih_count");
    if (savedCount) setCount(Number(savedCount));

    const savedTarget = localStorage.getItem("qs_tasbih_target");
    if (savedTarget) setTarget(Number(savedTarget));
  }, []);

  const saveState = (newCount: number, newTarget: number) => {
    localStorage.setItem("qs_tasbih_count", newCount.toString());
    localStorage.setItem("qs_tasbih_target", newTarget.toString());
  };

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignored
    }
  };

  const triggerVibrate = (isTargetReached: boolean) => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    if (isTargetReached) {
      navigator.vibrate([200, 100, 200]);
    } else {
      navigator.vibrate(50);
    }
  };

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    saveState(newCount, target);
    playClickSound();

    if (newCount === target) {
      triggerVibrate(true);
      addToast(
        "Target Tercapai",
        "Alhamdulillah, target tasbih Anda telah tercapai.",
        "success",
      );
    } else {
      triggerVibrate(false);
    }
  };

  const handleReset = () => {
    setCount(0);
    saveState(0, target);
    addToast("Tasbih Direset", "Penghitung tasbih kembali ke 0.", "info");
  };

  const handleTargetChange = (diff: number) => {
    const newTarget = Math.max(1, target + diff);
    setTarget(newTarget);
    saveState(count, newTarget);
  };

  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
          </button>
        )}
        <div>
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">
            Tasbih Digital
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            Dzikir & Mengingat Allah
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 items-center px-4 py-8">
        <div className="bg-white border text-center border-slate-100 p-8 pt-10 rounded-[32px] md:rounded-[40px] shadow-sm flex flex-col items-center justify-center w-full max-w-sm gap-8 relative overflow-hidden">
          {/* Decorative bg ring */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-[30px] border-[#EEF5F1] rounded-full z-0 opacity-40 mix-blend-multiply"></div>

          <div className="z-10 bg-white border border-emerald-100/60 shadow-xs rounded-2xl p-4 flex gap-4 w-full justify-between items-center relative">
            <div className="flex flex-col items-center text-slate-700 w-1/3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Rakaat
              </span>
              <span className="text-lg font-bold font-mono text-[#0F4C3A]">
                -
              </span>
            </div>
            <div className="flex flex-col items-center text-slate-700 w-1/3 border-x border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Target
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={() => handleTargetChange(-1)}
                  className="p-1 text-slate-400 hover:text-[#0F4C3A] hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-lg font-bold font-mono text-[#0F4C3A]">
                  {target}
                </span>
                <button
                  onClick={() => handleTargetChange(1)}
                  className="p-1 text-slate-400 hover:text-[#0F4C3A] hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center text-slate-700 w-1/3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Putaran
              </span>
              <span className="text-lg font-bold font-mono text-[#0F4C3A]">
                {count >= target ? Math.floor(count / target) : 0}
              </span>
            </div>
          </div>

          <div className="z-10 flex flex-col items-center drop-shadow-xl my-4">
            <span className="font-mono font-bold text-7xl sm:text-8xl text-slate-800 tabular-nums">
              {count.toString().padStart(3, "0")}
            </span>
            <span className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100/50">
              Total Hitungan
            </span>
          </div>

          <div className="z-10 flex flex-col items-center w-full gap-8">
            <button
              onClick={handleIncrement}
              className="w-36 h-36 rounded-full bg-gradient-to-b from-[#0F4C3A] to-emerald-950 text-white flex items-center justify-center shadow-xl shadow-emerald-900/30 relative overflow-hidden group border-8 border-white cursor-pointer active:scale-95 transition-transform"
            >
              <div className="absolute inset-0 border-[5px] border-emerald-800/40 rounded-full m-2"></div>
              <span className="text-3xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-md">
                👆
              </span>
            </button>

            <div className="flex justify-center gap-8 w-full pt-6 border-t border-slate-50/80 text-slate-500">
              <button
                onClick={handleReset}
                className="flex flex-col gap-1.5 items-center justify-center hover:text-slate-800 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-[9px] uppercase font-bold tracking-widest">
                  Reset
                </span>
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex flex-col gap-1.5 items-center justify-center hover:text-slate-800 transition cursor-pointer ${soundEnabled ? "text-emerald-700" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${soundEnabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className="text-[9px] uppercase font-bold tracking-widest">
                  Suara
                </span>
              </button>
              <button
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={`flex flex-col gap-1.5 items-center justify-center hover:text-slate-800 transition cursor-pointer ${vibrationEnabled ? "text-emerald-700" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${vibrationEnabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}
                >
                  <Focus className="w-4 h-4" />
                </div>
                <span className="text-[9px] uppercase font-bold tracking-widest">
                  Getar
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
