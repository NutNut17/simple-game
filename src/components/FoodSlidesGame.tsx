import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { THEMES } from '../constants';

interface FoodSlidesGameProps {
  title: string;
  subtitle: string;
  onExit: () => void;
}

const foodName = (id: string) => id.replace('-svgrepo-com', '').replace(/-/g, ' ');

export default function FoodSlidesGame({ title, subtitle, onExit }: FoodSlidesGameProps) {
  const themeConfig = THEMES.food;
  const [foods, setFoods] = useState(themeConfig.images);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (step: number) => {
    setDirection(step);
    setIndex(i => (i + step + foods.length) % foods.length);
  };

  const shuffle = () => {
    setFoods([...foods].sort(() => Math.random() - 0.5));
    setIndex(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [foods.length]);

  const current = foods[index];

  return (
    <div className={`flex-1 flex flex-col ${themeConfig.colors.bg} overflow-hidden w-full h-full`}>
      <div className={`${themeConfig.colors.primary} p-4 flex items-center justify-between border-b-4 border-black/20 shadow-xl`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 bg-black/20 hover:bg-black/40 px-5 py-2.5 rounded-2xl text-white font-black transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft size={18} strokeWidth={3} />
            <span className="hidden sm:inline">EXIT</span>
          </button>
          <div className="hidden md:block text-white">
            <h3 className="font-display font-black text-lg leading-none">{title}</h3>
            <p className="text-[10px] uppercase font-black opacity-60 mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xs uppercase tracking-widest">
            {index + 1} / {foods.length}
          </span>
          <button
            onClick={shuffle}
            className="bg-white/10 text-white px-3 py-2 rounded-xl border border-white/10 hover:bg-white/20 transition-all"
          >
            <Shuffle size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-4 p-4 sm:p-8">
        <button
          onClick={() => go(-1)}
          className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full active:scale-90 transition-all"
        >
          <ChevronLeft size={32} />
        </button>

        <div className="relative w-full max-w-2xl aspect-square">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ x: direction * 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -100, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-white rounded-[40px] shadow-2xl border-[12px] border-white/20 flex flex-col items-center justify-center p-8 gap-4"
            >
              <img
                src={`${import.meta.env.BASE_URL}themes/food/${current}.${themeConfig.extension}`}
                className="flex-1 min-h-0 w-full object-contain select-none"
                alt={foodName(current)}
              />
              <h2 className="text-4xl sm:text-5xl font-display font-black text-orange-700 uppercase tracking-tight">
                {foodName(current)}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => go(1)}
          className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full active:scale-90 transition-all"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
}
