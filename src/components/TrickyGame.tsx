import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, RotateCcw, Image as ImageIcon, MapPin, ArrowLeft, Ghost, LayoutGrid } from 'lucide-react';
import { THEMES, GameTheme } from '../constants';

interface TrickyGameProps {
  title: string;
  subtitle: string;
  onExit: () => void;
}

interface Hole {
  x: number;
  y: number;
  id: number;
}

export default function TrickyGame({ title, subtitle, onExit }: TrickyGameProps) {
  const [currentValue, setCurrentValue] = useState('');
  const [holes, setHoles] = useState<Hole[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const themeConfig = THEMES['tricky'];

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
  }, []);

  const handlePaperClick = (e: React.MouseEvent) => {
    if (isRevealed || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setHoles(prev => [...prev, { x, y, id: Math.random() }]);
  };

  const imagePath = `/tricky-image/${currentValue}.png`;

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
            <Ghost size={16} className="text-brand-accent" />
            <span className="text-white font-black text-[10px] uppercase tracking-widest">Scracks: {holes.length}</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => setIsRevealed(true)}
            className="bg-brand-accent text-brand-dark px-6 py-2 rounded-xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all text-[10px] uppercase tracking-wider flex items-center gap-2"
          >
            <Eye size={14} />
            Show Reality
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
          {/* Play Area: Everything inside SVG for perfect alignment */}
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            {currentValue && (
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <mask id="trickyMask">
                    {/* Entire paper is white (masked in) */}
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    {/* Holes are black (masked out) */}
                    {holes.map(hole => (
                      <circle key={hole.id} cx={hole.x} cy={hole.y} r="8" fill="black" />
                    ))}
                  </mask>

                  {/* Filter to turn the colorful parts of the image into a black shadow */}
                  <filter id="shadowFilter">
                    {/* Step 1: Detect color by comparing original with a shifted version (R->G, G->B, B->R) */}
                    <feColorMatrix type="matrix" values="0 1 0 0 0  0 0 1 0 0  1 0 0 0 0  0 0 0 1 0" result="shifted" />
                    
                    {/* Step 2: Get absolute difference between original and shifted. Grayscale pixels (R=G=B) will result in 0. */}
                    <feComposite in="SourceGraphic" in2="shifted" operator="difference" result="chroma" />
                    
                    {/* Step 3: Sum the chroma channels into the alpha channel to create a mask for colorful areas */}
                    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 1 1 0 0" result="chromaMask" />
                    
                    {/* Step 4: Threshold the alpha to create a solid mask for colorful pixels, finding a balance between coverage and noise */}
                    <feComponentTransfer in="chromaMask" result="thresholdedMask">
                       <feFuncA type="discrete" tableValues="0 0 1 1 1" />
                    </feComponentTransfer>

                    {/* Step 5: Final output - Convert to pure black while preserving the thresholded alpha mask */}
                    <feColorMatrix in="thresholdedMask" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
                  </filter>
                </defs>

                {/* Layer 0: The REAL colored image (Background) */}
                <image 
                  href={imagePath}
                  x="10" y="10" width="80" height="80"
                  preserveAspectRatio="xMidYMid meet"
                />

                {/* Layer 1: The Masking Paper Group */}
                <g mask="url(#trickyMask)">
                  {/* The White Paper Base */}
                  <rect 
                    x="0" y="0" width="100" height="100" 
                    fill="#fefefe" 
                  />

                  {/* The "Trick" Shadow - The same image but blacked out */}
                  <image 
                    href={imagePath}
                    x="10" y="10" width="80" height="80"
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#shadowFilter)"
                    opacity="0.95"
                  />

                  {/* Noise texture for paper */}
                  <rect 
                    x="0" y="0" width="100" height="100" 
                    fill="url(#noisePattern)" 
                    className="opacity-20"
                    pointerEvents="none"
                  />
                </g>
              </svg>
            )}
          </div>

          {!isRevealed && holes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-4 animate-pulse">
                <MapPin size={40} className="text-rose-400" />
                <div className="text-center">
                  <p className="text-white font-black uppercase tracking-widest text-sm">Who's that shadow?</p>
                  <p className="text-white/60 text-[10px] mt-1 font-bold">SCRATCH TO REVEAL REALITY</p>
                </div>
              </div>
            </div>
          )}

          {/* Reveal Result */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl text-white px-10 py-4 rounded-3xl shadow-2xl font-black text-2xl uppercase tracking-widest flex flex-col items-center gap-1 z-20 border-2 border-white/20"
              >
                <div className="flex items-center gap-3">
                  <Ghost className="text-rose-400" />
                  <span>TRICKED!</span>
                </div>
                <span className="text-sm opacity-60">IT'S A {currentValue.split('-')[0]}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* SVG Pattern Definitions (referenced by ID) */}
      <svg className="hidden">
        <defs>
          <pattern id="noisePattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
             <rect width="10" height="10" fill="white" />
             <circle cx="2" cy="2" r="0.5" fill="#aaa" />
             <circle cx="7" cy="6" r="0.8" fill="#999" />
             <circle cx="4" cy="8" r="0.3" fill="#bbb" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}
