import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, RefreshCw, Trophy, Clock, ArrowLeft, LayoutGrid } from 'lucide-react';
import { THEMES, GameTheme, GridSize } from '../constants';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameProps {
  mode: 'v1' | 'v2'; // v1: 10s preview, v2: normal pairs
  theme: GameTheme;
  gridSize: GridSize;
  title: string;
  subtitle: string;
  onExit: () => void;
}

export default function MemoryGame({ mode, theme, gridSize: initialGridSize, title, subtitle, onExit }: MemoryGameProps) {
  const [gridSize, setGridSize] = useState<GridSize>(initialGridSize);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [previewActive, setPreviewActive] = useState(mode === 'v1');
  const [timeLeft, setTimeLeft] = useState(10);
  const [allFlipped, setAllFlipped] = useState(mode === 'v1');
  const [rangeStart, setRangeStart] = useState(0); // A
  const [rangeEnd, setRangeEnd] = useState(7);   // H (Initial 8 letters)

  const themeConfig = THEMES[theme];

  const initGame = () => {
    const totalCells = gridSize * gridSize;
    const numPairs = Math.floor(totalCells / 2);
    
    let availableImages = [...themeConfig.images];
    
    if (theme === 'alphabet') {
      availableImages = themeConfig.images.slice(rangeStart, rangeEnd + 1);
    }

    // Ensure we have enough images by repeating if necessary, or just using what we have
    let pool = [...availableImages];
    while (pool.length < (mode === 'v2' ? numPairs : totalCells)) {
      pool = [...pool, ...availableImages];
    }
    
    const selectedImages = pool.slice(0, mode === 'v2' ? numPairs : totalCells);
    
    let values: string[] = [];
    if (mode === 'v2') {
      values = [...selectedImages, ...selectedImages];
      if (values.length < totalCells) {
        values.push(selectedImages[0]); // Repeat first image if odd grid
      }
    } else {
      values = selectedImages;
    }

    const shuffled = values
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: mode === 'v1',
        isMatched: false,
      }));
    setCards(shuffled);
    setMoves(0);
    setIsWon(false);
    setFlippedCards([]);
    setAllFlipped(mode === 'v1');
    
    if (mode === 'v1') {
      setPreviewActive(true);
      setTimeLeft(10);
    }
  };

  useEffect(() => {
    initGame();
  }, [theme, mode, gridSize, rangeStart, rangeEnd]);

  useEffect(() => {
    if (mode === 'v1' && previewActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(l => l - 1), 1000);
      return () => clearTimeout(timer);
    } else if (mode === 'v1' && timeLeft === 0 && previewActive) {
      setPreviewActive(false);
      setAllFlipped(false);
      setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
    }
  }, [timeLeft, previewActive, mode]);

  const handleCardClick = (id: number) => {
    if (previewActive || isWon) return;

    if (mode === 'v1') {
      // Independent flipping for Game 1
      setCards(prev => prev.map(c => 
        c.id === id ? { ...c, isFlipped: !c.isFlipped } : c
      ));
      setMoves(m => m + 1);
      return;
    }

    // Pair logic for Game 2
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newFlipped;

      if (cards[firstId].value === cards[secondId].value) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const toggleAll = () => {
    const newState = !allFlipped;
    setAllFlipped(newState);
    setCards(prev => prev.map(c => ({ ...c, isFlipped: newState })));
  };

  useEffect(() => {
    if (mode === 'v2' && cards.length > 0 && cards.every(c => c.isMatched || (gridSize * gridSize % 2 !== 0 && c.isFlipped))) {
      setIsWon(true);
    }
  }, [cards, mode, gridSize]);

  return (
    <div className={`flex-1 flex flex-col ${themeConfig.colors.bg} transition-colors duration-500 overflow-hidden`}>
      {/* Combined Header Bar */}
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

          {/* Moves Display */}
          <div className="flex items-center gap-6">
            <div className="text-white">
              <p className="text-[10px] font-black uppercase opacity-60 leading-none">Moves</p>
              <p className="text-xl font-display font-black uppercase">{moves}</p>
            </div>
            
            {mode === 'v1' && (
              <div className="flex items-center gap-2">
                 {previewActive ? (
                   <div className="flex items-center gap-2 bg-brand-accent px-3 py-1.5 rounded-xl text-black shadow-lg">
                      <Clock size={16} className="animate-spin" />
                      <span className="font-display font-black text-xl">0:{timeLeft.toString().padStart(2, '0')}</span>
                   </div>
                 ) : (
                   <button
                    onClick={toggleAll}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all ${allFlipped ? 'bg-brand-accent text-brand-dark' : 'bg-white/20 text-white hover:bg-white/30'}`}
                   >
                     {allFlipped ? <EyeOff size={14} /> : <Eye size={14} />}
                     <span className="hidden sm:inline">{allFlipped ? 'HIDE ALL' : 'SHOW ALL'}</span>
                   </button>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Configs */}
        <div className="flex items-center gap-3">
          {/* Alphabet Range Selector */}
          {theme === 'alphabet' && (
            <div className="hidden lg:flex items-center gap-2 bg-black/20 p-1 px-3 rounded-xl border border-white/10 h-10">
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

          {/* Grid Size Toggle */}
          <div className="flex bg-black/20 p-1 rounded-xl h-10">
             {[2, 3, 4, 5, 6].map(size => (
               <button
                 key={size}
                 disabled={mode === 'v2' && (size * size) % 2 !== 0}
                 onClick={() => setGridSize(size as GridSize)}
                 className={`w-8 h-full rounded-lg font-black text-xs flex items-center justify-center transition-all disabled:opacity-20 ${gridSize === size ? 'bg-white text-brand-dark shadow-lg' : 'text-white hover:bg-white/10'}`}
               >
                 {size}
               </button>
             ))}
          </div>
          
          <button 
            onClick={initGame}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:rotate-180"
          >
            <RefreshCw size={20} />
          </button>

          <div className="bg-white/20 p-2 rounded-xl border border-white/20 hidden sm:block">
            <LayoutGrid size={20} className="text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden">
        <div 
          className={`grid gap-2 sm:gap-4 w-full h-full max-w-[85vh] max-h-[85vh] aspect-square mx-auto`}
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        >
          {cards.map((card) => (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.95 }}
              className={`relative cursor-pointer perspective-1000 w-full h-full`}
            >
              <div className={`w-full h-full transition-all duration-500 transform-style-3d ${(card.isFlipped || card.isMatched) ? 'rotate-y-180' : ''}`}>
                {/* Back of card */}
                <div className={`absolute inset-0 ${themeConfig.colors.primary} ${themeConfig.colors.border} border-b-4 sm:border-b-8 rounded-xl sm:rounded-2xl flex items-center justify-center backface-hidden shadow-xl`}>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-full blur-xl animate-pulse" />
                </div>
                
                {/* Front of card */}
                <div className={`absolute inset-0 bg-white rounded-xl sm:rounded-2xl flex flex-col items-center justify-center rotate-y-180 backface-hidden shadow-2xl overflow-hidden ${card.isMatched ? 'ring-2 sm:ring-4 ring-green-400' : ''}`}>
                   {theme === 'alphabet' ? (
                     <span className={`font-black text-indigo-900 drop-shadow-sm ${gridSize >= 5 ? 'text-xl sm:text-3xl' : gridSize >= 4 ? 'text-2xl sm:text-5xl' : 'text-5xl sm:text-8xl'}`}>
                      {card.value}
                     </span>
                   ) : (
                     <div className="w-full h-full p-1 sm:p-2 flex flex-col items-center justify-center">
                        <img 
                          src={`${import.meta.env.BASE_URL}themes/${theme}/${card.value}.${themeConfig.extension || 'png'}`} 
                          alt={card.value}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                          className="w-full h-full object-contain"
                        />
                        <span className="hidden text-sm sm:text-xl font-bold text-gray-700 uppercase p-2 text-center break-all leading-tight">
                          {card.value}
                        </span>
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isWon && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
          >
            <div className="bg-white rounded-[50px] p-12 text-center max-w-sm w-full relative overflow-hidden">
               <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-accent rounded-full opacity-20 blur-3xl" />
               <Trophy className="w-24 h-24 text-brand-accent mx-auto mb-6 animate-bounce" />
               <h2 className="text-5xl font-display font-black text-indigo-950 mb-2">VICTORY!</h2>
               <p className="text-gray-500 font-bold mb-8 italic">You finished in {moves} moves!</p>
               
               <div className="flex flex-col gap-3">
                 <button 
                   onClick={initGame}
                   className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-transform"
                 >
                   PLAY AGAIN
                 </button>
                 <button 
                   onClick={onExit}
                   className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-xl hover:bg-gray-200 transition-colors"
                 >
                   MAIN MENU
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
