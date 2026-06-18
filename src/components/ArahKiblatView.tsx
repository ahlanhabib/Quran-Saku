import { PageContainer } from "./PageContainer";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, AlertTriangle, MapPin, ArrowLeft } from "lucide-react";

interface ArahKiblatViewProps {
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
  onBack?: () => void;
}

export const ArahKiblatView: React.FC<ArahKiblatViewProps> = ({
  addToast,
  onBack,
}) => {
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [manualHeading, setManualHeading] = useState(135);
  const [supportsSensor, setSupportsSensor] = useState(false);
  const [isSoundOn] = useState(true);
  const [isVibrateOn] = useState(true);

  const triggerVibrate = (ms: number) => {
    if (isVibrateOn && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const triggerSound = (pitch = 440, duration = 0.08) => {
    if (!isSoundOn) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as any).webkitCompassHeading || 360 - (e.alpha || 0);
      if (typeof heading === "number" && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
        if (!supportsSensor) setSupportsSensor(true);
      }
    };

    if (window.DeviceOrientationEvent) {
      // Request permission for iOS 13+ if possible (in a real app this is usually triggered by a button)
      window.addEventListener(
        "deviceorientationabsolute",
        handleOrientation as any,
        true,
      );
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation as any,
        true,
      );
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [supportsSensor]);

  const [targetKiblatAngle, setTargetKiblatAngle] = useState(295); // Default to Jakarta
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic Qibla Calculator using Haversine-based formula
    const getQiblaAngle = (lat: number, lng: number) => {
      const PI = Math.PI;
      const latRad = (lat * PI) / 180;
      const lngRad = (lng * PI) / 180;
      const meccaLat = (21.4225 * PI) / 180;
      const meccaLng = (39.8262 * PI) / 180;

      const y = Math.sin(meccaLng - lngRad);
      const x =
        Math.cos(latRad) * Math.tan(meccaLat) -
        Math.sin(latRad) * Math.cos(meccaLng - lngRad);
      let angle = Math.atan2(y, x) * (180 / PI);
      return (angle + 360) % 360;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const qibla = getQiblaAngle(lat, lng);
          setTargetKiblatAngle(Math.round(qibla));

          try {
            // Optional: Get locality name
             const r = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`,
            );
            if (r.ok) {
              const data = await r.json();
              const loc =
                data.city || data.locality || data.principalSubdivision;
              if (loc)
                setGpsLocation(
                  loc.replace(/Kabupaten|Kota|Kab\./gi, "").trim(),
                );
            }
          } catch (e) {}
        },
        (error) => {
          // Ignore, fallback to 295
        },
      );
    }
  }, []);

  const activeCompassHeading = supportsSensor ? deviceHeading : manualHeading;
  const isAligned = Math.abs(activeCompassHeading - targetKiblatAngle) <= 6;

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
            Arah Kiblat
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            Kompas Terintegrasi
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 items-center px-4 py-8 w-full max-w-md mx-auto">
        <div className="bg-white border w-full border-slate-100 p-8 pt-10 rounded-[40px] shadow-sm flex flex-col items-center justify-center gap-8 relative overflow-hidden">
          <div className="w-full bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-center">
            <h3 className="font-serif font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />{" "}
              {gpsLocation ? `Kiblat di ${gpsLocation}` : "Kompas Kiblat"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Target kiblat di lokasi Anda berkisar pada sudut ~
              {targetKiblatAngle}°.
            </p>
          </div>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-full border border-slate-200/60 shadow p-6 flex items-center justify-center select-none overflow-hidden">
            <div className="absolute inset-4 rounded-full border border-slate-200 border-dashed"></div>
            <div className="absolute inset-16 rounded-full border border-[#0F4C3A]/5"></div>

            <motion.div
              animate={{ rotate: -activeCompassHeading }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              className="absolute w-full h-full p-6 flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center font-bold text-[10px] text-slate-400">
                <span className="absolute top-2 text-[#0F4C3A] font-extrabold">
                  U
                </span>
                <span className="absolute right-2">T</span>
                <span className="absolute bottom-2">S</span>
                <span className="absolute left-2">B</span>

                <span className="absolute top-10 right-10 text-[8px] opacity-50">
                  TL
                </span>
                <span className="absolute bottom-10 right-10 text-[8px] opacity-50">
                  TG
                </span>
                <span className="absolute bottom-10 left-10 text-[8px] opacity-50">
                  BD
                </span>
                <span className="absolute top-10 left-10 text-[8px] opacity-50">
                  BL
                </span>

                <div className="w-44 h-44 rounded-full border-2 border-slate-200/55 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border border-slate-100 bg-white/20"></div>
                </div>

                <div
                  className="absolute w-12 h-12 flex items-center justify-center"
                  style={{
                    transform: `rotate(${targetKiblatAngle}deg) translateY(-84px)`,
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    <span className="text-[9px] font-extrabold text-amber-500 bg-[#0F4C3A] px-1.5 py-0.5 rounded-full shadow-sm">
                      KIBLAT
                    </span>
                    <span className="text-sm">🕋</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center">
              <div
                className={`w-1 bg-gradient-to-t from-red-600 to-red-500 h-16 rounded-full shadow-lg ${isAligned ? "animate-pulse" : ""}`}
              ></div>
              <div className="w-4 h-4 mt-1 rounded-full border-4 border-slate-800 bg-white shadow z-10"></div>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center">
              <span className="text-[11px] font-mono font-extrabold text-slate-700 bg-white border border-slate-200/50 px-2 py-0.5 rounded-lg shadow-sm">
                {activeCompassHeading}°
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isAligned ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center w-full flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 animate-bounce">
                  <span className="text-lg">✨</span>
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Arah Kiblat Tepat!
                  </h4>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Siap mendaratkan sujud ibadah menghadap Ka'bah.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl text-center w-full"
              >
                <p className="text-[11px] text-slate-500 leading-normal">
                  {supportsSensor
                    ? "Putar perangkat perlahan sampai garis menunjuk ke arah ikon Ka'bah 🕋."
                    : "Gunakan kontrol slider di bawah untuk mensimulasikan perputaran kompas interaktif:"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!supportsSensor && (
            <div className="w-full flex flex-col gap-1.5 mt-1 border-t border-slate-100 pt-6 px-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>SIMULASI KOMPAS MANUAL</span>
                <span className="text-emerald-700 font-extrabold">
                  SASARAN: {targetKiblatAngle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={manualHeading}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setManualHeading(val);
                  if (Math.abs(val - targetKiblatAngle) <= 6) {
                    triggerVibrate(80);
                    triggerSound(523, 0.15); // aligned chord
                  }
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0° (U)</span>
                <span>180° (S)</span>
                <span>359°</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
