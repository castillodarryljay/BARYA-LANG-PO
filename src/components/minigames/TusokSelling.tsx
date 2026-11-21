import React, { useState } from 'react';
import { soundFX } from '../../engine/audio';

interface Props {
  onFinish: (scoreRatio: number) => void;
  language: 'taglish' | 'english';
}

interface MarketDay {
  day: number;
  headline: string;
  headlineEn: string;
  demandMultiplier: number; // higher = more buyers
  priceTolerance: number; // higher = willing to pay more
}

const DAYS: MarketDay[] = [
  {
    day: 1,
    headline: 'Maaraw at PE Day — sobrang uhaw at gutom ang mga estudyante!',
    headlineEn: 'Sunny PE Day — students are starving and thirsty after drills!',
    demandMultiplier: 1.35,
    priceTolerance: 1.15,
  },
  {
    day: 2,
    headline: 'Maulan sa labas — kaunti ang nasa gate pero hanap nila mainit na kwek-kwek.',
    headlineEn: 'Rainy afternoon — smaller crowd, craving hot kwek-kwek.',
    demandMultiplier: 0.85,
    priceTolerance: 1.0,
  },
  {
    day: 3,
    headline: 'Exam Week! Ubos ang yellow pad at mabilisang snacks sa canteen!',
    headlineEn: 'Exam Week! Everyone needs yellow pads and quick street snacks!',
    demandMultiplier: 1.45,
    priceTolerance: 1.25,
  },
  {
    day: 4,
    headline: 'Petsa de Peligro (Friday) — naghahanap ng pinakamurang tusok-tusok!',
    headlineEn: 'Broke Friday — students hunt for the cheapest snacks possible!',
    demandMultiplier: 1.1,
    priceTolerance: 0.8,
  },
];

export const TusokSelling: React.FC<Props> = ({ onFinish, language }) => {
  const [dayIdx, setDayIdx] = useState(0);
  const [stock, setStock] = useState<number>(20);
  const [price, setPrice] = useState<number>(15);
  const [totalProfit, setTotalProfit] = useState(0);
  const [lastLog, setLastLog] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const day = DAYS[dayIdx];
  const unitCost = 8;

  const sellToday = () => {
    const baseBuyers = 26 * day.demandMultiplier;
    const priceFactor = price <= 12 ? 1.25 : price <= 16 ? 1.0 : 0.62 * day.priceTolerance;
    const buyers = Math.max(4, Math.round(baseBuyers * priceFactor));
    const sold = Math.min(stock, buyers);
    const revenue = sold * price;
    const cost = stock * unitCost;
    const profit = revenue - cost;

    if (profit >= 0) soundFX.playCoin();
    else soundFX.playError();

    setTotalProfit((p) => p + profit);
    setLastLog(
      language === 'taglish'
        ? `Day ${day.day}: Nabenta ${sold}/${stock} packs · Kita: ${profit >= 0 ? '+' : ''}₱${profit}`
        : `Day ${day.day}: Sold ${sold}/${stock} packs · Net: ${profit >= 0 ? '+' : ''}₱${profit}`
    );

    if (dayIdx + 1 >= DAYS.length) {
      setDone(true);
    } else {
      setDayIdx((i) => i + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-mono tabular-nums bg-[#251a13] border border-amber-900/50 rounded-xl px-4 py-3">
        <div>
          <span className="text-amber-300/70 mr-2">DAY</span>
          <span className="text-lg font-bold text-amber-200">
            {Math.min(dayIdx + 1, DAYS.length)}/{DAYS.length}
          </span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">NET PROFIT</span>
          <span className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            ₱{totalProfit}
          </span>
        </div>
      </div>

      {lastLog && (
        <div className="text-xs bg-[#2c1f16] border border-amber-700/50 rounded-xl px-3.5 py-2 text-amber-200">
          {lastLog}
        </div>
      )}

      {!done ? (
        <div className="bg-[#2c1f16] border border-amber-800/50 rounded-2xl p-4 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-amber-400">
              {language === 'taglish' ? `Balita sa Campus · Day ${day.day}` : `Campus Forecast · Day ${day.day}`}
            </div>
            <p className="text-sm text-amber-50">
              {language === 'taglish' ? day.headline : day.headlineEn}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-amber-200/80">
              <span>{language === 'taglish' ? 'Stock to Buy (₱8 each):' : 'Stock to Buy (₱8 each):'}</span>
              <span className="font-mono font-bold text-amber-300">{stock} packs (Cost ₱{stock * unitCost})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[15, 25, 35].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setStock(qty);
                  }}
                  className={`min-h-[44px] rounded-xl border text-sm font-mono font-bold ${
                    stock === qty
                      ? 'bg-amber-500 text-[#1c120b] border-amber-300'
                      : 'bg-[#1f1610] text-amber-200 border-amber-900/60'
                  }`}
                >
                  {qty} pcs
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-amber-200/80">
              <span>{language === 'taglish' ? 'Presyo per pack:' : 'Selling Price per pack:'}</span>
              <span className="font-mono font-bold text-emerald-300">₱{price}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 12, label: '₱12 Tipid' },
                { val: 15, label: '₱15 Sakto' },
                { val: 20, label: '₱20 Mahal' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setPrice(opt.val);
                  }}
                  className={`min-h-[44px] rounded-xl border text-xs sm:text-sm font-semibold ${
                    price === opt.val
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-[#1f1610] text-amber-200 border-amber-900/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={sellToday}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'Buksan ang Stall Ngayon!' : 'Open Stall for Today!'}
          </button>
        </div>
      ) : (
        <div className="bg-[#2c1f16] border border-amber-600/50 rounded-2xl p-6 text-center space-y-4">
          <h3 className="font-pixel text-2xl text-amber-300">
            {language === 'taglish' ? 'Sold Out ang Tindahan!' : 'Campus Selling Complete!'}
          </h3>
          <p className="text-sm text-amber-100/85">
            {language === 'taglish'
              ? `Total Net Profit mo sa 4 araw: ₱${Math.max(0, totalProfit)}!`
              : `Total 4-Day Net Profit: ₱${Math.max(0, totalProfit)}!`}
          </p>
          <button
            type="button"
            onClick={() => onFinish(Math.min(1, Math.max(0.1, totalProfit / 650)))}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'I-deposit ang Kita (₱)' : 'Collect Business Profit (₱)'}
          </button>
        </div>
      )}
    </div>
  );
};
