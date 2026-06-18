import { PageContainer } from "./PageContainer";
import React, { useState, useRef } from "react";
import { ArrowLeft, Play, Pause, Radio } from "lucide-react";

interface Props {
  onBack: () => void;
  addToast: (t: string, m: string, type: "success"|"warning"|"info") => void;
}

export const RadioIslamView: React.FC<Props> = ({ onBack, addToast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
       if (isPlaying) {
         audioRef.current.pause();
         setIsPlaying(false);
       } else {
         audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
            addToast("Error", "Gagal memutar streaming radio.", "warning");
         });
       }
    }
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
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">Radio Islam</h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">Streaming 24/7</p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 space-y-4">
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
            
            <div className="w-24 h-24 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
              {isPlaying && (
                <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-ping opacity-20"></div>
              )}
              <Radio className={`w-10 h-10 ${isPlaying ? 'text-emerald-500' : 'text-slate-400'}`} />
            </div>

            <h3 className="font-bold text-xl text-slate-800 mb-2">Makkah Live Murottal</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">Streaming Murottal Al-Qur'an 24 Jam Nonstop</p>

            <button 
              onClick={togglePlay}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white shadow-lg transition-all active:scale-95 ${isPlaying ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-[#0F4C3A] hover:bg-emerald-800 shadow-emerald-900/30'}`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
            </button>

            {/* Hidden Audio Element */}
            {/* Using a public MP3 source for demo purposes */}
            <audio 
              ref={audioRef} 
              src="https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3" 
              onError={() => {
                setIsPlaying(false);
              }}
              preload="none"
            />
         </div>
      </div>
    </PageContainer>
  );
};
