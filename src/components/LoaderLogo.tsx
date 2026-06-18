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
        className="relative flex items-center justify-center"
      >
        <img 
          src="/QuranSaku.png" 
          alt="Quran Saku" 
          className="w-32 h-auto drop-shadow-xl"
        />
        
        {/* Glow effect behind the logo */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.2, 0.9] }}
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
