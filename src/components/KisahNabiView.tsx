import { PageContainer } from "./PageContainer";
import React, { useState } from "react";
import { ArrowLeft, Users, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KISAH_NABI } from "../data/kisahNabiData";

interface Props {
  onBack: () => void;
}

export const KisahNabiView: React.FC<Props> = ({ onBack }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const activeKisah = KISAH_NABI.find(k => k.id === selectedId);

  return (
    <PageContainer>
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
        <button
          onClick={() => {
            if (selectedId) setSelectedId(null)
            else onBack()
          }}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
        </button>
        <div>
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">
            {selectedId ? activeKisah?.name : "Kisah Nabi & Rasul"}
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            {selectedId ? activeKisah?.title : "Kisah 25 Rasul Utusan Allah"}
          </p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8">
        <AnimatePresence mode="wait">
          {!selectedId ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pb-8">
              {KISAH_NABI.map((nabi, idx) => (
                <button
                  key={nabi.id}
                  onClick={() => setSelectedId(nabi.id)}
                  className="w-full bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left hover:border-slate-300 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{nabi.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{nabi.title}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-8">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                 <div className="w-16 h-16 bg-[#0F4C3A]/10 text-[#0F4C3A] rounded-2xl flex items-center justify-center mb-5">
                    <Users className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800 mb-1">{activeKisah?.name}</h2>
                 <p className="text-sm text-slate-500 font-bold mb-6 pb-6 border-b border-slate-100">{activeKisah?.title}</p>
                 
                 <div className="prose prose-sm prose-slate text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                    <p>{activeKisah?.fullContent || activeKisah?.summary}</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
};
