import React from "react";
import { motion } from "motion/react";

export const LoaderLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-5 w-full h-[60vh]">
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8] 
        }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-40 h-40 rounded-full bg-emerald-50/50 border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-900/5 relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-[-4px] rounded-full border-2 border-dashed border-[#0F4C3A]/20"
        />
        <img 
          src="/QuranSaku.png" 
          alt="Quran Saku" 
          className="w-24 h-auto drop-shadow-xl z-10"
        />
        
        {/* Glow effect behind the logo */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#0F4C3A]/10 blur-xl rounded-full -z-10"
        />
      </motion.div>
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <h3 className="font-serif font-bold text-[#0F4C3A] text-lg">Memuat Data...</h3>
        <p className="text-xs text-slate-500 font-medium">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
};
