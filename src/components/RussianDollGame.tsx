import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, RotateCcw, HelpCircle, Volume2, VolumeX, Sparkles, Milestone } from 'lucide-react';
import { THEMES, GameTheme } from '../constants';

interface RussianDollGameProps {
  theme: GameTheme;
  title: string;
  subtitle: string;
  onExit: () => void;
}

interface Doll {
  id: string;
  value: string;
  isOpen: boolean;
  isReal: boolean;
}

type ScrambleMode = 'classic' | 'tricky';

const LEVEL_STYLES = [
  {
    primary: '#e11d48', // Crimson Red
    accent: '#fda4af',  // Rose Light
    bellyBorder: '#fbbf24', // Gold
    flowerColor: '#fff',
    detailColor: '#f1f5f9'
  },
  {
    primary: '#0891b2', // Ocean Cyan
    accent: '#67e8f9',  // Cyan Light
    bellyBorder: '#f43f5e', // Rose
    flowerColor: '#fef08a',
    detailColor: '#fff'
  },
  {
    primary: '#d97706', // Amber Gold
    accent: '#fde047',  // Yellow Light
    bellyBorder: '#10b981', // Green
    flowerColor: '#fda4af',
    detailColor: '#e2e8f0'
  },
  {
    primary: '#059669', // Emerald Green
    accent: '#6ee7b7',  // Emerald Light
    bellyBorder: '#f59e0b', // Orange
    flowerColor: '#fdf4ff',
    detailColor: '#f8fafc'
  },
  {
    primary: '#4f46e5', // Royal Indigo
    accent: '#a5b4fc',  // Indigo Light
    bellyBorder: '#ec4899', // Pink
    flowerColor: '#a5f3fc',
    detailColor: '#f3e8ff'
  },
  {
    primary: '#db2777', // Sweet Pink
    accent: '#f9a8d4',  // Pink Light
    bellyBorder: '#f59e0b', // Gold
    flowerColor: '#fff',
    detailColor: '#fff5f5'
  }
];

// Dedicated toy artwork that powers the letter-scramble puzzles in this game
const TOY_ITEMS = ['kite', 'top', 'yoyo', 'chinese-yoyo'];
const getToyImageSrc = (value: string) => `${import.meta.env.BASE_URL}themes/toy/${value}.jpg`;

// Fallback emoji in case a toy image fails to load
function getEmojiFallback(value: string): string {
  const map: Record<string, string> = {
    kite: '🪁',
    top: '🌀',
    yoyo: '🪀',
    'chinese-yoyo': '🪀'
  };
  return map[value] || '🧸';
}

// Format the name of a toy beautifully (e.g. "chinese-yoyo" -> "Chinese Yoyo")
const getNiceName = (value: string): string => {
  if (!value) return '';
  const clean = value.replace('-svgrepo-com', '').replace('-', ' ');
  return clean.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// The word a puzzle is built from -- letters only, lower-cased (e.g. "Chinese Yoyo" -> "chineseyoyo")
const getScrambleWord = (value: string): string =>
  getNiceName(value).replace(/[^a-zA-Z]/g, '').toLowerCase();

// Shuffle a word's letters, retrying so the result isn't identical to the original spelling
function shuffleLetters(word: string): string[] {
  const letters = word.split('');
  if (letters.length <= 1) return letters;

  let shuffled = letters;
  let attempts = 0;
  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (shuffled.join('') === word && attempts < 8);

  return shuffled;
}

// Build the letter sequence revealed one doll at a time: the word's letters in
// shuffled order, with a few unrelated "trickster" letters mixed in for tricky mode
function buildLetterSequence(word: string, mode: ScrambleMode): { char: string; isReal: boolean }[] {
  const sequence = shuffleLetters(word).map(char => ({ char, isReal: true }));

  if (mode === 'tricky') {
    const usedLetters = new Set(word.split(''));
    const noisePool = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !usedLetters.has(c));
    const noiseCount = Math.max(1, 12 - word.length);

    for (let n = 0; n < noiseCount; n++) {
      const noiseChar = noisePool[Math.floor(Math.random() * noisePool.length)];
      const pos = Math.floor(Math.random() * (sequence.length + 1));
      sequence.splice(pos, 0, { char: noiseChar, isReal: false });
    }
  }

  return sequence;
}

export default function RussianDollGame({ theme, title, subtitle, onExit }: RussianDollGameProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [gameMode, setGameMode] = useState<ScrambleMode>('classic');
  const [toyIdx, setToyIdx] = useState(0);
  const [roundToy, setRoundToy] = useState(TOY_ITEMS[0]);
  const [roundWord, setRoundWord] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const themeConfig = THEMES[theme] || THEMES.alphabet;

  // Synthesize custom retro sound effects to keep it immersive
  const playSound = (type: 'pop' | 'success' | 'click' | 'fail' | 'slide') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'slide') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'success') {
        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.08, now + idx * 0.08);
          gain.gain.setValueAtTime(0.08, now + idx * 0.08 + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
      } else if (type === 'fail') {
        const now = ctx.currentTime;
        const notes = [220.00, 196.00]; // A3, G3
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.1, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.3);
        });
      }
    } catch (err) {
      console.warn('Web Audio warning:', err);
    }
  };

  // Pick a toy, scramble its name into a letter sequence, and stack a fresh nest of dolls for it
  const generateRound = (mode: ScrambleMode = gameMode, idx: number = toyIdx) => {
    const safeIdx = ((idx % TOY_ITEMS.length) + TOY_ITEMS.length) % TOY_ITEMS.length;
    const toy = TOY_ITEMS[safeIdx];
    const word = getScrambleWord(toy);
    const sequence = buildLetterSequence(word, mode);

    const newDolls: Doll[] = sequence.map((item, i) => ({
      id: `doll-${i}-${Math.random()}`,
      value: item.char.toUpperCase(),
      isOpen: false,
      isReal: item.isReal
    }));

    setRoundToy(toy);
    setRoundWord(word);
    setDolls(newDolls);
    setActiveIdx(0);
    setIsRevealed(false);
  };

  useEffect(() => {
    setFailedImages({});
    setToyIdx(0);
    generateRound('classic', 0);
  }, []);

  const handleOpenDoll = (index: number) => {
    if (isRevealed || index !== activeIdx || index >= dolls.length || dolls[index].isOpen) return;

    // The smallest baby doll has nothing nested inside -- its letter is already showing,
    // so there's nothing left to split open. Leave it be once it's the one in focus.
    if (index === dolls.length - 1) return;

    playSound('pop');
    setDolls(prev => prev.map((d, i) => i === index ? { ...d, isOpen: true } : d));

    // Slide focus to the next doll so its letter comes into view
    setTimeout(() => {
      setActiveIdx(prev => prev + 1);
      playSound('slide');
    }, 380);
  };

  const handleModeChange = (mode: ScrambleMode) => {
    if (mode === gameMode) return;
    playSound('click');
    setGameMode(mode);
    generateRound(mode, toyIdx);
  };

  const handleReveal = () => {
    if (isRevealed) return;
    playSound('success');
    setIsRevealed(true);
  };

  const handleReshuffle = () => {
    playSound('click');
    generateRound(gameMode, toyIdx);
  };

  const handleNextToy = () => {
    playSound('click');
    const nextIdx = (toyIdx + 1) % TOY_ITEMS.length;
    setToyIdx(nextIdx);
    generateRound(gameMode, nextIdx);
  };

  // Each doll's letter shows the moment it comes into focus, so "letters shown" tracks activeIdx
  const lettersShown = dolls.length > 0 ? Math.min(activeIdx + 1, dolls.length) : 0;
  const allRevealed = dolls.length > 0 && lettersShown === dolls.length;

  return (
    <div className={`flex-1 flex flex-col ${themeConfig.colors.bg} overflow-hidden relative w-full h-full`}>
      {/* Top Bar */}
      <div className={`${themeConfig.colors.primary} p-4 flex flex-wrap items-center justify-between gap-3 border-b-4 border-black/20 relative z-30 transition-colors duration-500 shadow-xl`}>
        {/* Left Side: Exit + title + mode selector */}
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

          {/* Mode Selector */}
          <div className="flex bg-black/20 p-1 rounded-xl items-center gap-1 h-10 border border-white/5">
            <button
              onClick={() => handleModeChange('classic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                gameMode === 'classic' ? 'bg-white text-brand-dark shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              SCRAMBLE
            </button>
            <button
              onClick={() => handleModeChange('tricky')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                gameMode === 'tricky' ? 'bg-white text-brand-dark shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              TRICKY MIX
            </button>
          </div>
        </div>

        {/* Right Side: Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2.5 bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl text-white transition-all active:scale-95"
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Puzzle Status & Controls Strip -- replaces the old streak/banner clutter with one efficient row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-black/15 border-b-2 border-black/10 relative z-20">
        <div className="flex items-center gap-3 text-white min-w-0">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Milestone size={18} className="text-brand-accent" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-black text-brand-accent tracking-widest block leading-none">
              Unscramble The Toy
            </span>
            <span className="text-white text-sm font-black truncate block mt-1">
              {dolls.length === 0
                ? 'Stacking the nest…'
                : allRevealed
                  ? 'All letters shown — make your guess, then hit Reveal!'
                  : `${lettersShown} / ${dolls.length} letters shown${gameMode === 'tricky' ? ' · watch for tricksters!' : ''}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReveal}
            className="flex items-center gap-1.5 bg-brand-accent hover:brightness-110 text-brand-dark px-4 py-2.5 rounded-xl font-black shadow-lg transition-all active:scale-95 text-xs uppercase"
          >
            <HelpCircle size={14} strokeWidth={3} /> Reveal
          </button>
          <button
            onClick={handleReshuffle}
            className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 border border-white/10 text-white px-4 py-2.5 rounded-xl font-black transition-all active:scale-95 text-xs uppercase"
          >
            <RotateCcw size={14} strokeWidth={3} /> Reshuffle
          </button>
          <button
            onClick={handleNextToy}
            className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 border border-white/10 text-white px-4 py-2.5 rounded-xl font-black transition-all active:scale-95 text-xs uppercase"
          >
            <Sparkles size={14} strokeWidth={3} /> Next Toy
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative select-none">
        <div className="relative w-full max-w-2xl h-full max-h-[560px] flex items-center justify-center border-[12px] border-white/20 rounded-[48px] shadow-[0_0_50px_rgba(255,255,255,0.02)] backdrop-blur-[1px] overflow-hidden bg-black/10">

          {/* Animated dolls stack representation -- each belly reveals one scrambled letter */}
          <div className="relative flex items-center justify-center w-full h-full">
            {dolls
              .map((doll, index) => ({ doll, index }))
              .filter(({ index }) => {
                const diff = index - activeIdx;
                return diff >= -1 && diff <= 2;
              })
              .sort((a, b) => {
                const diffA = a.index - activeIdx;
                const diffB = b.index - activeIdx;
                return diffB - diffA; // Order: 2, 1, 0, -1 so inner smaller dolls are rendered first (on bottom)
              })
              .map(({ doll, index }) => (
                <DollWrapper
                  key={doll.id}
                  doll={doll}
                  diff={index - activeIdx}
                  index={index}
                  onOpen={() => handleOpenDoll(index)}
                />
              ))}
          </div>

          {/* Reveal Overlay -- shows the answer once the player asks for it */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/90 backdrop-blur-lg z-50 p-6"
              >
                <motion.div
                  initial={{ scale: 0.7, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.7, y: 50 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="bg-indigo-950 border-4 border-brand-accent/50 p-6 rounded-[36px] max-w-sm w-full text-center shadow-3xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 skew-y-12 -mt-16 pointer-events-none" />

                  <div className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center mb-3 shadow-md border-2 border-brand-accent overflow-hidden relative">
                    {!failedImages[roundToy] ? (
                      <img
                        src={getToyImageSrc(roundToy)}
                        alt={roundToy}
                        className="w-full h-full object-contain p-1.5 select-none"
                        onError={() => setFailedImages(prev => ({ ...prev, [roundToy]: true }))}
                      />
                    ) : (
                      <span className="text-4xl">{getEmojiFallback(roundToy)}</span>
                    )}
                  </div>

                  <span className="bg-brand-accent text-brand-dark px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                    <Trophy size={12} strokeWidth={3} /> It Was...
                  </span>

                  <h2 className="text-white text-2xl font-display font-black uppercase tracking-widest leading-tight">
                    {getNiceName(roundToy)}
                  </h2>

                  <div className="flex flex-wrap justify-center gap-1.5 my-3">
                    {roundWord.split('').map((ch, i) => (
                      <span
                        key={i}
                        className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 text-white rounded-lg font-black uppercase text-sm"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>

                  {gameMode === 'tricky' && dolls.some(d => !d.isReal) && (
                    <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wide mb-3 px-2">
                      Tricky letters mixed in: {dolls.filter(d => !d.isReal).map(d => d.value).join(' · ')}
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleNextToy}
                      className="bg-brand-accent hover:brightness-110 active:scale-95 text-brand-dark py-3 px-8 rounded-2xl font-black text-sm uppercase tracking-widest transition-all w-full shadow-lg"
                    >
                      Next Toy 🧸
                    </button>
                    <button
                      onClick={handleReshuffle}
                      className="text-white/40 hover:text-white hover:bg-white/5 py-2 rounded-xl font-bold text-xs transition-all w-full"
                    >
                      Reshuffle This Toy
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage Pedestal */}
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

// Visual Wrapper Component for nesting dolls
interface DollWrapperProps {
  key?: React.Key;
  doll: Doll;
  diff: number;
  index: number;
  onOpen: () => void;
}

function DollWrapper({ doll, diff, index, onOpen }: DollWrapperProps) {
  const style = LEVEL_STYLES[index % LEVEL_STYLES.length];

  // Map values relative to current focus Doll (diff === index - activeIdx)
  let scale = 1.0;
  let y = 0;
  let opacity = 1.0;
  let zIndex = 10;
  let pointerEvents: 'auto' | 'none' = 'none';

  if (diff === -1) {
    // Doll was just opened, currently splitting out of the center focus
    zIndex = 15;
    opacity = 1.0;
    pointerEvents = 'none';
  } else if (diff === 0) {
    // Top-most closed doll (or beginning to open)
    scale = 1.0;
    y = 0;
    opacity = 1.0;
    zIndex = 10;
    pointerEvents = doll.isOpen ? 'none' : 'auto';
  } else if (diff === 1) {
    // Nested first sub-doll
    scale = 0.52;
    y = 24.5; // Sits nicely inside parent's stomach (scaled from 35)
    opacity = 0.95;
    zIndex = 5;
    pointerEvents = 'none';
  } else if (diff === 2) {
    // Double nested sub-doll
    scale = 0.28;
    y = 36.4; // Sits nicely inside parent's stomach (scaled from 52)
    opacity = 0.45;
    zIndex = 2;
    pointerEvents = 'none';
  }

  // The click target -- always opens the doll to reveal its letter
  const handleBodyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen();
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: 175,
        height: 245,
        zIndex,
        pointerEvents
      }}
      animate={{
        scale,
        y,
        opacity: diff === -1 ? 0 : opacity
      }}
      transition={{
        type: 'spring',
        stiffness: 140,
        damping: 18
      }}
      className="flex items-center justify-center cursor-pointer select-none"
    >
      {/* Top Half of Doll (Lid) */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'inset(0% 0% 53.33% 0%)',
          zIndex: 10
        }}
        animate={doll.isOpen ? { y: -126, rotate: -18, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={handleBodyClick}
      >
        <DollBody style={style} value={doll.value} />
      </motion.div>

      {/* Bottom Half of Doll (Base) */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'inset(46.66% 0% 0% 0%)',
          zIndex: 9
        }}
        animate={doll.isOpen ? { y: 126, rotate: 18, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={handleBodyClick}
      >
        <DollBody style={style} value={doll.value} />
      </motion.div>
    </motion.div>
  );
}

// Single drawing of the Matryoshka doll body, with its scrambled-letter belly
interface DollBodyProps {
  style: typeof LEVEL_STYLES[0];
  value: string;
}

function DollBody({ style, value }: DollBodyProps) {
  return (
    <div className="relative w-full h-full select-none">
      {/* Custom Vector SVG Design of Doll */}
      <svg className="w-full h-full" viewBox="0 0 200 300">
        <defs>
          {/* Subtle 3D volumetric linear gradient */}
          <linearGradient id={`scarfGrad-${style.primary}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.accent} />
            <stop offset="60%" stopColor={style.primary} />
            <stop offset="100%" stopColor="#11050e" stopOpacity="0.4" />
          </linearGradient>

          {/* High contrast shiny light beam */}
          <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="15%" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="35%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* 1. Main Scarf/Outer Body silhouette shape */}
        <path
          d="M 100 20 C 60 20, 60 110, 50 150 C 35 200, 45 280, 100 280 C 155 280, 165 200, 150 150 C 140 110, 140 20, 100 20 Z"
          fill={`url(#scarfGrad-${style.primary})`}
          stroke="#111"
          strokeWidth="4"
          className="filter drop-shadow-lg"
        />

        {/* 2. Shiny Highlight beam over Scarf */}
        <path
          d="M 100 22 C 62 22, 62 110, 52 150 C 37 200, 47 278, 100 278"
          fill="none"
          stroke="url(#shineGrad)"
          strokeWidth="3.5"
          pointerEvents="none"
        />

        {/* Scarf Dots Patterns on Dress margins */}
        <circle cx="55" cy="160" r="4.5" fill={style.accent} stroke="#000" strokeWidth="1" />
        <circle cx="145" cy="160" r="4.5" fill={style.accent} stroke="#000" strokeWidth="1" />
        <circle cx="50" cy="210" r="4.5" fill={style.accent} stroke="#000" strokeWidth="1" />
        <circle cx="150" cy="210" r="4.5" fill={style.accent} stroke="#000" strokeWidth="1" />
        <circle cx="58" cy="255" r="4.5" fill={style.accent} stroke="#000" strokeWidth="1" />
        <circle cx="142" cy="255" r="4.5" fill={style.accent} stroke="#000" strokeWidth="1" />

        {/* Scarf Ribbon Floral Deco near Hair */}
        <circle cx="68" cy="46" r="5" fill="#e11d48" />
        <circle cx="63" cy="47" r="4.2" fill={style.flowerColor} />
        <circle cx="73" cy="47" r="4.2" fill={style.flowerColor} />
        <circle cx="68" cy="41" r="4.2" fill={style.flowerColor} stroke="#000" strokeWidth="0.5" />

        {/* 3. Scarf Face Cutout Lace Border (Lace Scallop base) */}
        <circle cx="100" cy="95" r="39.5" fill="none" stroke="#fcf6ec" strokeWidth="5.5" strokeDasharray="3.5 3.5" />
        <circle cx="100" cy="95" r="38" fill="none" stroke="#222" strokeWidth="1.5" />

        {/* 4. Face Base Canvas */}
        <circle cx="100" cy="95" r="35" fill={style.detailColor} stroke="#222" strokeWidth="3" />

        {/* 5. Hair styling (cute bangs framing face) */}
        <path d="M 66 93 C 65 72, 85 64, 100 64 C 115 64, 135 72, 134 93 C 122 84, 114 91, 100 87 C 86 91, 78 84, 66 93 Z" fill="#4a2c11" stroke="#222" strokeWidth="2" />

        {/* 6. Happy Closed Eyes */}
        <path d="M 83 91 Q 89 85 95 91" stroke="#2c1706" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M 105 91 Q 111 85 117 91" stroke="#2c1706" strokeWidth="3.2" fill="none" strokeLinecap="round" />

        {/* Eyelash ticks */}
        <path d="M 81 90 L 76 86" stroke="#2c1706" strokeWidth="2" strokeLinecap="round" />
        <path d="M 119 90 L 124 86" stroke="#2c1706" strokeWidth="2" strokeLinecap="round" />

        {/* 7. Cute Cheeks (Rosy Blush) */}
        <circle cx="82" cy="100" r="5.5" fill="#f43f5e" opacity="0.45" />
        <circle cx="118" cy="100" r="5.5" fill="#f43f5e" opacity="0.45" />

        {/* 8. Smiling red mouth */}
        <path d="M 96 102 Q 100 106 104 102" stroke="#be123c" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* 9. Scarf Knot under the chin */}
        <path d="M 98 131 L 84 146 L 95 148 L 100 142 Z" fill="#b91c1c" stroke="#111" strokeWidth="1.5" />
        <path d="M 102 131 L 116 146 L 105 148 L 100 142 Z" fill="#b91c1c" stroke="#111" strokeWidth="1.5" />
        <circle cx="100" cy="131" r="6" fill="#dc2626" stroke="#111" strokeWidth="2" />

        {/* 10. White Apron/Belly Backing Oval */}
        <ellipse cx="100" cy="210" rx="46" ry="48" fill="#ffffff" stroke="#222" strokeWidth="3" />
        <ellipse cx="100" cy="210" rx="42" ry="44" fill="none" stroke={style.bellyBorder} strokeWidth="3" strokeDasharray="3 3.5" />
      </svg>

      {/* 11. Responsive Overlaid Belly Letter -- one scrambled character per doll */}
      <div
        className="absolute flex items-center justify-center select-none"
        style={{
          left: '28%',
          top: '55.5%',
          width: '44%',
          height: '27.5%',
          transform: 'translateY(-1px)'
        }}
      >
        <span className="text-3xl md:text-5xl font-black text-[#1e1b4b] select-none uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-normal">
          {value}
        </span>
      </div>
    </div>
  );
}
