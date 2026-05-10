import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, RotateCcw, Image as ImageIcon, MapPin, ArrowLeft, LayoutGrid } from 'lucide-react';
import { THEMES, GameTheme } from '../constants';

interface RevealGameProps {
  theme: GameTheme;
  title: string;
  subtitle: string;
  onExit: () => void;
}

interface Hole {
  x: number;
  y: number;
  id: number;
}

export default function RevealGame({ theme, title, subtitle, onExit }: RevealGameProps) {
  const [currentValue, setCurrentValue] = useState('');
  const [holes, setHoles] = useState<Hole[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const themeConfig = THEMES[theme];

  const spawnNewImage = () => {
    const images = themeConfig.images;
    if (!images || images.length === 0) return;
    const next = images[Math.floor(Math.random() * images.length)];
    setCurrentValue(next);
    setHoles([]);
    setIsRevealed(false);
  };

  useEffect(() => {
    spawnNewImage();
  }, [theme]);

  const handlePaperClick = (e: React.MouseEvent) => {
    if (isRevealed || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setHoles(prev => [...prev, { x, y, id: Math.random() }]);
  };

  return (
    <div className={`flex-1 flex flex-col ${themeConfig.colors.bg} overflow-hidden relative w-full h-full`}>
      {/* Combined Top Bar */}
      <div className={`${themeConfig.colors.primary} p-4 flex items-center justify-between border-b-4 border-black/20 relative z-30 transition-colors duration-500 shadow-xl`}>
        {/* Left Side: Exit + Game info */}
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

          <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-2 h-10">
            <Eye size={16} className="text-brand-accent" />
            <span className="text-white font-black text-[10px] uppercase tracking-widest">Peepholes: {holes.length}</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => setIsRevealed(true)}
            className="bg-brand-accent text-brand-dark px-6 py-2 rounded-xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all text-[10px] uppercase tracking-wider flex items-center gap-2"
          >
            <Eye size={14} />
            Show Answer
          </button>
          <button 
            onClick={spawnNewImage}
            className="bg-white/10 text-white px-3 py-2 rounded-xl font-black border border-white/10 hover:bg-white/20 transition-all"
          >
            <RotateCcw size={16} />
          </button>
          <div className="bg-white/20 p-2 rounded-xl border border-white/20 hidden sm:block">
            <LayoutGrid size={20} className="text-white" />
          </div>
        </div>
      </div>

      {/* Play Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div 
          ref={containerRef}
          onClick={handlePaperClick}
          className="relative w-full max-w-2xl aspect-square bg-white rounded-[40px] shadow-2xl border-[12px] border-white/20 overflow-hidden cursor-crosshair group"
        >
          {/* Hidden Image */}
          <div className="absolute inset-0 flex items-center justify-center p-12 bg-gray-50">
             {theme === 'alphabet' ? (
                <span className="text-[15rem] font-black text-black select-none">
                  {currentValue}
                </span>
             ) : (
                <img 
                  src={`/themes/${theme}/${currentValue}.${themeConfig.extension || 'png'}`}
                  className="w-full h-full object-contain pointer-events-none select-none"
                  alt="Hidden"
                />
             )}
          </div>

          {/* Paper Cover with Mask */}
          <AnimatePresence>
            {!isRevealed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10"
              >
                {/* We use a SVG to create a mask for the holes */}
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <mask id="holeMask">
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      {holes.map(hole => (
                        <circle key={hole.id} cx={hole.x} cy={hole.y} r="8" fill="black" />
                      ))}
                    </mask>
                  </defs>
                  <rect 
                    x="0" y="0" width="100" height="100" 
                    fill="currentColor" 
                    className="text-gray-300"
                    mask="url(#holeMask)"
                  />
                  {/* Paper texture/noise simulation */}
                  <rect 
                    x="0" y="0" width="100" height="100" 
                    fill="url(#noisePattern)" 
                    className="opacity-40"
                    mask="url(#holeMask)"
                    pointerEvents="none"
                  />
                </svg>

                {/* Instructions Overlay if no holes yet */}
                {holes.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-4 animate-bounce">
                      <MapPin size={40} className="text-brand-accent" />
                      <p className="text-white font-black uppercase tracking-widest text-xs">Click to peek!</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reveal Feedback */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-brand-primary text-white px-10 py-4 rounded-3xl shadow-2xl font-black text-2xl uppercase tracking-tighter flex items-center gap-4 z-20 border-4 border-white"
              >
                <ImageIcon size={32} />
                {currentValue.split('-')[0]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* SVG Definitions */}
      <svg className="hidden">
        <defs>
          <pattern id="noisePattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
             <rect width="10" height="10" fill="white" />
             <circle cx="2" cy="2" r="0.5" fill="#ddd" />
             <circle cx="7" cy="6" r="0.8" fill="#ccc" />
             <circle cx="4" cy="8" r="0.3" fill="#eee" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}
