import React from "react";
import { motion } from "motion/react";
import { BookOpen } from "lucide-react";

export const LoaderLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4 w-full h-[60vh]">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7] 
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-900/5 relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-[-2px] rounded-full border border-dashed border-[#0F4C3A]/20"
        />
        <BookOpen className="w-8 h-8 text-[#0F4C3A]" />
      </motion.div>
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <h3 className="font-serif font-bold text-slate-800 text-lg">Memuat Data...</h3>
        <p className="text-xs text-slate-500 font-medium">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
};
