import { PageContainer } from "./PageContainer";
import React, { useState } from "react";
import { ArrowLeft, Calculator, Coins, Info } from "lucide-react";
import { motion } from "motion/react";

interface KalkulatorZakatViewProps {
  onBack: () => void;
}

export const KalkulatorZakatView: React.FC<KalkulatorZakatViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<"profesi" | "maal">("profesi");
  
  // Zakat Profesi state
  const [pendapatan, setPendapatan] = useState("");
  const [bonus, setBonus] = useState("");

  // Zakat Maal state
  const [tabungan, setTabungan] = useState("");
  const [investasi, setInvestasi] = useState("");
  const [hutang, setHutang] = useState("");

  // Consts
  const HARGA_EMAS_PER_GRAM = 1200000; // Asumsi harga emas terkini per gram
  const NISHAB_MAAL_TAHUNAN = 85 * HARGA_EMAS_PER_GRAM; // 85 gram emas per tahun
  const NISHAB_PROFESI_BULANAN = NISHAB_MAAL_TAHUNAN / 12; // Nishab profesi per bulan (dikiaskan ke emas)

  const parseNum = (val: string) => Number(val.replace(/\./g, "")) || 0;

  const formatInputAmount = (val: string) => {
    const numericValue = val.replace(/\D/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("id-ID").format(Number(numericValue));
  };

  const hitungZakatProfesi = () => {
    const total = parseNum(pendapatan) + parseNum(bonus);
    // Cek apakah mencapai nishab bulanan
    if (total >= NISHAB_PROFESI_BULANAN) {
      return total * 0.025;
    }
    return 0; // Tidak wajib zakat jika di bawah nishab
  };

  const hitungZakatMaal = () => {
    const total = parseNum(tabungan) + parseNum(investasi) - parseNum(hutang);
    if (total >= NISHAB_MAAL_TAHUNAN) {
      return total * 0.025;
    }
    return 0;
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
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
        <h2 className="font-serif font-bold text-lg text-[#0F4C3A]">Kalkulator Zakat</h2>
      </div>

      <div className="p-5 max-w-2xl mx-auto w-full">
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab("profesi")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition cursor-pointer ${
              activeTab === "profesi" ? "bg-white text-[#0F4C3A] shadow-sm" : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            Zakat Profesi
          </button>
          <button
            onClick={() => setActiveTab("maal")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition cursor-pointer ${
              activeTab === "maal" ? "bg-white text-[#0F4C3A] shadow-sm" : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            Zakat Maal
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        >
          {activeTab === "profesi" ? (
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl flex gap-3 text-sm mb-6">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p>Nishab zakat profesi diasumsikan setara 85 gram emas per tahun. Jika penghasilan bulanan melebihinya, wajib dikeluarkan 2.5%.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pendapatan Bulanan (Rutin)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pendapatan}
                    onChange={(e) => setPendapatan(formatInputAmount(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A] transition font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bonus / THP Tambahan (Opsional)</label>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bonus}
                    onChange={(e) => setBonus(formatInputAmount(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A] transition font-mono"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-end">
                  {(parseNum(pendapatan) + parseNum(bonus)) < NISHAB_PROFESI_BULANAN && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">Belum Mencapai Nishab</span>
                  )}
                  {(parseNum(pendapatan) + parseNum(bonus)) >= NISHAB_PROFESI_BULANAN && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Wajib Zakat</span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="text-sm font-bold text-slate-500">Zakat yang harus dibayar (Per Bulan)</h4>
                </div>
                <div className="text-3xl font-bold font-mono text-[#0F4C3A]">
                  {formatRupiah(hitungZakatProfesi())}
                </div>
                <p className="text-xs text-slate-400 mt-2">Nishab Bulanan: {formatRupiah(NISHAB_PROFESI_BULANAN)} (Asumsi Emas {formatRupiah(HARGA_EMAS_PER_GRAM)}/gr)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl flex gap-3 text-sm mb-6">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p>Nishab zakat harta (maal) adalah 85 gram emas. Harta yang telah mengendap 1 tahun (haul) wajib dizakati 2.5%.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tabungan / Uang Tunai</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tabungan}
                    onChange={(e) => setTabungan(formatInputAmount(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A] transition font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Investasi / Emas (Estimasi Nilai)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={investasi}
                    onChange={(e) => setInvestasi(formatInputAmount(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A] transition font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Hutang Jatuh Tempo (Pengurang)</label>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={hutang}
                    onChange={(e) => setHutang(formatInputAmount(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition font-mono"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-end">
                  {(parseNum(tabungan) + parseNum(investasi) - parseNum(hutang)) < NISHAB_MAAL_TAHUNAN && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">Belum Mencapai Nishab</span>
                  )}
                  {(parseNum(tabungan) + parseNum(investasi) - parseNum(hutang)) >= NISHAB_MAAL_TAHUNAN && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Wajib Zakat</span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="text-sm font-bold text-slate-500">Zakat yang harus dibayar (Per Tahun)</h4>
                </div>
                <div className="text-3xl font-bold font-mono text-[#0F4C3A]">
                  {formatRupiah(hitungZakatMaal())}
                </div>
                <p className="text-xs text-slate-400 mt-2">Nishab Tahunan: {formatRupiah(NISHAB_MAAL_TAHUNAN)} (Asumsi Emas {formatRupiah(HARGA_EMAS_PER_GRAM)}/gr)</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageContainer>
  );
};
