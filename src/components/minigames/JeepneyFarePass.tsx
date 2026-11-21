import React, { useEffect, useState } from 'react';
import { soundFX } from '../../engine/audio';

interface Props {
  onFinish: (scoreRatio: number) => void;
  language: 'taglish' | 'english';
}

interface FareTicket {
  passenger: string;
  paid: number;
  fare: number;
  change: number;
}

const PASSENGERS = ['Estudyante (1x)', '2 Pasahero', 'Manang (Senior)', 'Taga-Kanto', 'Barkada (3x)'];

function nextTicket(): FareTicket {
  const presets = [
    { paid: 20, fare: 13 },
    { paid: 20, fare: 15 },
    { paid: 50, fare: 13 },
    { paid: 50, fare: 26 },
    { paid: 50, fare: 39 },
    { paid: 100, fare: 52 },
    { paid: 100, fare: 65 },
    { paid: 50, fare: 15 },
    { paid: 20, fare: 11 },
  ];
  const pick = presets[Math.floor(Math.random() * presets.length)];
  return {
    passenger: PASSENGERS[Math.floor(Math.random() * PASSENGERS.length)],
    paid: pick.paid,
    fare: pick.fare,
    change: pick.paid - pick.fare,
  };
}

const COINS = [1, 5, 10, 20];

export const JeepneyFarePass: React.FC<Props> = ({ onFinish, language }) => {
  const [timeLeft, setTimeLeft] = useState(40);
  const [ticket, setTicket] = useState<FareTicket>(() => nextTicket());
  const [givenCoins, setGivenCoins] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  const currentTotal = givenCoins.reduce((sum, c) => sum + c, 0);

  const addCoin = (val: number) => {
    if (done) return;
    soundFX.playClick();
    setGivenCoins((prev) => [...prev, val]);
  };

  const clearCoins = () => {
    soundFX.playClick();
    setGivenCoins([]);
  };

  const submitChange = () => {
    if (done) return;
    if (currentTotal === ticket.change) {
      soundFX.playCoin();
      setCorrectCount((c) => c + 1);
      setStatus(language === 'taglish' ? 'Eksakto! Salamat boss!' : 'Exact change! Thank you!');
      setGivenCoins([]);
      setTicket(nextTicket());
    } else {
      soundFX.playError();
      setStatus(
        language === 'taglish'
          ? `Kulang/Sobra! Dapat ₱${ticket.change} ang sukli.`
          : `Off by ₱${Math.abs(currentTotal - ticket.change)}! Target is ₱${ticket.change}.`
      );
      setGivenCoins([]);
    }
  };

  const handleDragStart = (e: React.DragEvent, val: number) => {
    e.dataTransfer.setData('text/plain', String(val));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const val = Number(e.dataTransfer.getData('text/plain'));
    if (COINS.includes(val)) addCoin(val);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-mono tabular-nums bg-[#251a13] border border-amber-900/50 rounded-xl px-4 py-3">
        <div>
          <span className="text-amber-300/70 mr-2">TIME</span>
          <span className={`text-lg font-bold ${timeLeft <= 8 ? 'text-rose-400' : 'text-amber-200'}`}>
            {timeLeft}s
          </span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">EXACT SUKLI</span>
          <span className="text-lg font-bold text-emerald-300">{correctCount}</span>
        </div>
      </div>

      {!done ? (
        <>
          <div className="bg-[#2c1f16] border border-amber-800/50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-200/75">
              <span>{ticket.passenger}</span>
              {status && <span className="text-amber-300 font-medium">{status}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 font-mono tabular-nums">
              <div className="bg-[#1e1510] rounded-xl p-3 border border-amber-900/40">
                <div className="text-[11px] text-amber-300/70">BAYAD / PAID</div>
                <div className="text-2xl font-bold text-amber-200">₱{ticket.paid}</div>
              </div>
              <div className="bg-[#1e1510] rounded-xl p-3 border border-amber-900/40">
                <div className="text-[11px] text-amber-300/70">PAMASAHE / FARE</div>
                <div className="text-2xl font-bold text-sky-300">₱{ticket.fare}</div>
              </div>
            </div>
          </div>

          {/* Drop / Coin Tray */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="bg-[#1f1610] border-2 border-dashed border-amber-700/70 rounded-2xl p-4 text-center space-y-2"
          >
            <div className="text-xs text-amber-200/75">
              {language === 'taglish'
                ? 'I-tap o i-drag ang mga barya dito (Sukli Tray):'
                : 'Tap or drag coins into this change tray:'}
            </div>
            <div className="font-mono tabular-nums text-3xl font-bold text-amber-300">
              ₱{currentTotal}
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 min-h-[28px]">
              {givenCoins.map((c, idx) => (
                <span
                  key={`${c}-${idx}`}
                  className="px-2 py-0.5 text-xs font-mono bg-amber-500/20 border border-amber-500/50 text-amber-200 rounded"
                >
                  ₱{c}
                </span>
              ))}
            </div>
          </div>

          {/* Coin buttons */}
          <div className="grid grid-cols-4 gap-2.5">
            {COINS.map((coin) => (
              <button
                key={coin}
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, coin)}
                onClick={() => addCoin(coin)}
                className="min-h-[56px] rounded-xl bg-amber-600/30 hover:bg-amber-500/40 border border-amber-400/70 font-mono tabular-nums text-lg font-bold text-amber-100 pixel-btn"
              >
                +₱{coin}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={clearCoins}
              className="min-h-[48px] rounded-xl bg-[#2c1f16] hover:bg-[#3a291d] border border-amber-900/60 text-amber-200 font-semibold text-sm"
            >
              {language === 'taglish' ? 'Bura' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={submitChange}
              className="col-span-2 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base pixel-btn"
            >
              {language === 'taglish' ? 'I-abot ang Sukli!' : 'Hand Over Change!'}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-[#2c1f16] border border-amber-600/50 rounded-2xl p-6 text-center space-y-4">
          <h3 className="font-pixel text-2xl text-amber-300">
            {language === 'taglish' ? 'Para po! Tapos ang Biyahe!' : 'Route Complete!'}
          </h3>
          <p className="text-sm text-amber-100/85">
            {language === 'taglish'
              ? `${correctCount} tamang sukli ang naibigay mo kay Manong Driver!`
              : `You returned ${correctCount} exact changes without losing a single peso!`}
          </p>
          <button
            type="button"
            onClick={() => onFinish(Math.min(1, correctCount / 8))}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'Kunin ang Boundary Share (₱)' : 'Collect Fare Share (₱)'}
          </button>
        </div>
      )}
    </div>
  );
};
