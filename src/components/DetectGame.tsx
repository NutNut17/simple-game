import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, MoveRight, Shuffle, Hash, Play, ArrowLeft, LayoutGrid } from 'lucide-react';
import { THEMES, GameTheme } from '../constants';

interface DetectGameProps {
  theme: GameTheme;
  title: string;
  subtitle: string;
  onExit: () => void;
}

type SpeedLevel = 1 | 2 | 3 | 4 | 5;
type DirectionMode = 1 | 2 | 3;

interface FlyingCard {
  id: number;
  value: string;
  isOutlier: boolean;
  startPos: { x: string; y: string };
  endPos: { x: string; y: string };
  duration: number;
  delay: number;
}

export default function DetectGame({ theme, title, subtitle, onExit }: DetectGameProps) {
  const [speed, setSpeed] = useState<SpeedLevel>(3);
  const [count, setCount] = useState(5);
  const [dirMode, setDirMode] = useState<DirectionMode>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCards, setActiveCards] = useState<FlyingCard[]>([]);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(7);

  const themeConfig = THEMES[theme];

  const getDuration = (level: SpeedLevel) => {
    // Faster range overall: Level 1 (1s) -> Level 5 (0.2s)
    // Slower by 0.5x as requested (multiplying seconds by 2)
    const map: Record<SpeedLevel, number> = {
      1: 2.0,
      2: 1.4,
      3: 1.0,
      4: 0.6,
      5: 0.4
    };
    return map[level];
  };

  const getRandomValue = (exclude?: string) => {
    let images = [...themeConfig.images];
    if (theme === 'alphabet') {
      const start = Math.min(rangeStart, rangeEnd);
      const end = Math.max(rangeStart, rangeEnd);
      images = themeConfig.images.slice(start, end + 1);
    }

    if (!images || images.length === 0) return '⭐';
    let val = images[Math.floor(Math.random() * images.length)];
    if (exclude && images.length > 1) {
      while (val === exclude) {
        val = images[Math.floor(Math.random() * images.length)];
      }
    }
    return val;
  };

  const spawnRound = () => {
    const common = getRandomValue();
    const outlier = getRandomValue(common);
    const outlierIdx = Math.floor(Math.random() * count);
    const duration = getDuration(speed);

    // Coordinate system relative to the container stage
    // Using larger offsets to ensure cards start/end completely outside
    const sides = [
      { name: 'top', left: '50%', top: '-50%' },
      { name: 'right', left: '150%', top: '50%' },
      { name: 'bottom', left: '50%', top: '150%' },
      { name: 'left', left: '-50%', top: '50%' }
    ];

    const newCards: FlyingCard[] = Array.from({ length: count }).map((_, i) => {
      let startIdx = 1;
      let endIdx = 3;

      if (dirMode === 1 || dirMode === 2) {
        startIdx = 1; // Right-middle
        endIdx = 3;   // Left-middle
      } else if (dirMode === 3) {
        startIdx = Math.floor(Math.random() * 4);
        endIdx = (startIdx + 2) % 4; // Opposite side 
      }

      const getOffset = () => `${(Math.random() * 80 + 10)}%`;
      const start = { ...sides[startIdx] };
      const end = { ...sides[endIdx] };

      // Set random orthogonal coordinate to spread them out
      if (startIdx % 2 === 0) start.left = getOffset(); else start.top = getOffset();
      if (endIdx % 2 === 0) end.left = getOffset(); else end.top = getOffset();

      // Mode 1: Mid-to-Mid strictly
      if (dirMode === 1) {
        start.top = '50%';
        end.top = '50%';
      }

      // Mode 1: Sequential Spawn (wait for previous card to cross)
      // Mode 2 & 3: Simultaneous (each takes duration t)
      const delay = dirMode === 1 ? i * (duration + 0.1) : i * 0.05;

      return {
        id: Math.random(),
        value: i === outlierIdx ? outlier : common,
        isOutlier: i === outlierIdx,
        startPos: { x: start.left, y: start.top },
        endPos: { x: end.left, y: end.top },
        duration,
        delay
      };
    });

    setActiveCards([]);
    setIsPlaying(true);
    setTimeout(() => {
      setActiveCards(newCards);
    }, 50);
  };

  return (
    <div className={`flex-1 flex flex-col ${themeConfig.colors.bg} overflow-hidden relative w-full h-full`}>
      {/* Combined Top Bar */}
      <div className={`${themeConfig.colors.primary} p-4 flex items-center justify-between border-b-4 border-black/20 relative z-30 transition-colors duration-500 shadow-xl`}>
        {/* Left Side: Exit + Game Stats */}
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 bg-black/20 hover:bg-black/40 px-5 py-2.5 rounded-2xl text-white font-black transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft size={18} strokeWidth={3} />
            <span className="hidden sm:inline">EXIT</span>
          </button>

          <div className="hidden md:block text-white">
            <h3 className="font-display font-black text-white text-lg leading-none">{title}</h3>
            <p className="text-[10px] uppercase font-black opacity-60 mt-1">{subtitle}</p>
          </div>

          <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />
        </div>

        {/* Middle: Config Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-black/20 p-1 rounded-xl items-center gap-1 px-2 h-10 border border-white/5">
            <Zap size={12} className="text-brand-accent mr-1" fill="currentColor" />
            {[1, 2, 3, 4, 5].map(lv => (
              <button
                key={lv}
                onClick={() => setSpeed(lv as SpeedLevel)}
                className={`w-7 h-7 rounded-lg font-black text-[10px] transition-all ${speed === lv ? 'bg-white text-brand-dark shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {lv}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex bg-black/20 p-1 pl-3 rounded-xl items-center gap-2 h-10 border border-white/5">
            <Hash size={12} className="text-white/30" />
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-8 bg-transparent text-white font-black text-center focus:outline-none appearance-none text-[10px]"
            />
            <div className="flex flex-col gap-0 pr-1">
              <button onClick={() => setCount(s => Math.min(50, s + 1))} className="text-white/30 hover:text-white leading-none text-[6px]">▲</button>
              <button onClick={() => setCount(s => Math.max(1, s - 1))} className="text-white/30 hover:text-white leading-none text-[6px]">▼</button>
            </div>
          </div>

          <div className="flex bg-black/20 p-1 rounded-xl items-center gap-0.5 h-10 border border-white/5">
            <button onClick={() => setDirMode(1)} className={`p-1.5 px-3 rounded-lg transition-all ${dirMode === 1 ? 'bg-white text-brand-dark shadow-md' : 'text-white/40 hover:bg-white/5'}`} title="Sequential">
              <MoveRight size={16} />
            </button>
            <button onClick={() => setDirMode(2)} className={`p-1.5 px-3 rounded-lg transition-all ${dirMode === 2 ? 'bg-white text-brand-dark shadow-md' : 'text-white/40 hover:bg-white/5'}`} title="Simultaneous">
              <div className="flex items-center">
                <MoveRight size={12} />
                <Shuffle size={10} className="-ml-1 opacity-50" />
              </div>
            </button>
            <button onClick={() => setDirMode(3)} className={`p-1.5 px-3 rounded-lg transition-all ${dirMode === 3 ? 'bg-white text-brand-dark shadow-md' : 'text-white/40 hover:bg-white/5'}`} title="Random">
              <Shuffle size={16} />
            </button>
          </div>

          {/* Alphabet Range Selector */}
          {theme === 'alphabet' && (
            <div className="hidden lg:flex items-center gap-2 bg-black/20 p-1 px-3 rounded-xl border border-white/10 h-10 border border-white/5">
              <span className="text-[9px] font-black text-white/50 uppercase">Range</span>
              <select
                value={rangeStart}
                onChange={(e) => setRangeStart(parseInt(e.target.value))}
                className="bg-transparent text-white font-black text-xs outline-none cursor-pointer"
              >
                {themeConfig.images.map((img, i) => (
                  <option key={img} value={i} className="bg-indigo-900">{img}</option>
                ))}
              </select>
              <span className="text-white/30">-</span>
              <select
                value={rangeEnd}
                onChange={(e) => setRangeEnd(parseInt(e.target.value))}
                className="bg-transparent text-white font-black text-xs outline-none cursor-pointer"
              >
                {themeConfig.images.map((img, i) => (
                  <option key={img} value={i} disabled={i < rangeStart} className="bg-indigo-900">{img}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Start Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={spawnRound}
            className="bg-brand-accent text-brand-dark px-6 py-2 rounded-xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all text-[10px] tracking-wider uppercase"
          >
            {isPlaying ? 'RUN' : 'START'}
          </button>
          <div className="bg-white/20 p-2 rounded-xl border border-white/20 hidden sm:block">
            <LayoutGrid size={20} className="text-white" />
          </div>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 relative overflow-hidden bg-black/10 flex items-center justify-center border-[12px] border-white/40 m-4 sm:m-8 rounded-[48px] shadow-[0_0_40px_rgba(255,255,255,0.05)] backdrop-blur-[1px]">
        {!isPlaying && activeCards.length === 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={spawnRound}
            className="flex flex-col items-center gap-8 z-40 group"
          >
            <div className="w-32 h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:border-white/40 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Play className="text-white ml-1 opacity-40 group-hover:opacity-100 transition-opacity" size={48} fill="currentColor" />
            </div>
            <p className="text-white font-black tracking-[0.5em] text-[11px] uppercase opacity-20 group-hover:opacity-60 transition-opacity">Launch Detection</p>
          </motion.button>
        )}

        <AnimatePresence>
          {isPlaying && activeCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{
                left: card.startPos.x,
                top: card.startPos.y,
                opacity: 0
              }}
              animate={{
                left: card.endPos.x,
                top: card.endPos.y,
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: card.duration,
                ease: "linear",
                delay: card.delay,
                opacity: {
                  times: [0, 0.05, 0.95, 1], // Fades only when crossing the boundary
                  duration: card.duration
                }
              }}
              onAnimationComplete={() => {
                if (idx === activeCards.length - 1) {
                  setTimeout(() => setIsPlaying(false), 500);
                }
              }}
              style={{ transform: 'translate(-50%, -50%)' }}
              className="absolute w-28 h-28 sm:w-48 sm:h-48 bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-black flex items-center justify-center z-20 pointer-events-none"
            >
              {theme === 'alphabet' ? (
                <span className="text-7xl sm:text-[10rem] font-black text-black select-none">
                  {card.value}
                </span>
              ) : (
                <img
                  src={`${import.meta.env.BASE_URL}themes/${theme}/${card.value}.${themeConfig.extension || 'png'}`}
                  className="w-full h-full object-contain p-4 select-none"
                  alt={card.value}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Dynamic Watermark */}
        <div className="absolute bottom-10 right-10 opacity-5 pointer-events-none">
          <Zap size={200} className="text-white" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}
