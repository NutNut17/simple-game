import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Sparkles, Brain, ArrowLeft, Trophy, ChevronRight, LayoutGrid, Grid2X2, Grid3X3, Zap, Eye, Ghost } from 'lucide-react';
import { useState } from 'react';
import MemoryGame from './components/MemoryGame';
import DetectGame from './components/DetectGame';
import RevealGame from './components/RevealGame';
import TrickyGame from './components/TrickyGame';
import RussianDollGame from './components/RussianDollGame';
import TetrisGame from './components/TetrisGame';
import { THEMES, GameTheme, GridSize } from './constants';

const GAMES = [
  {
    id: 'v1',
    title: 'Memory Game 1',
    subtitle: '10 sec memory',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-700',
    accentColor: 'text-indigo-200',
    icon: <Brain className="w-10 h-10" />,
  },
  {
    id: 'v2',
    title: 'Memory Game 2',
    subtitle: 'card pairs',
    color: 'bg-rose-500',
    borderColor: 'border-rose-700',
    accentColor: 'text-rose-200',
    icon: <Sparkles className="w-10 h-10" />,
  },
  {
    id: 'v3',
    title: 'Flyby',
    subtitle: "detect what's flying",
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-700',
    accentColor: 'text-emerald-200',
    icon: <Zap className="w-10 h-10" />,
  },
  {
    id: 'v4',
    title: 'Reveal',
    subtitle: "peek through holes",
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-700',
    accentColor: 'text-indigo-200',
    icon: <Eye className="w-10 h-10" />,
  },
  {
    id: 'v5',
    title: 'Tricky Reveal',
    subtitle: "shadow vs reality",
    color: 'bg-rose-500',
    borderColor: 'border-rose-700',
    accentColor: 'text-rose-200',
    icon: <Ghost className="w-10 h-10" />,
  },
  {
    id: 'v6',
    title: 'Russian Doll',
    subtitle: 'nesting shapes',
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-700',
    accentColor: 'text-emerald-200',
    icon: <Grid2X2 className="w-10 h-10" />,
  },
  {
    id: 'v7',
    title: 'Russian Tetris',
    subtitle: 'classic blocks',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-700',
    accentColor: 'text-indigo-200',
    icon: <LayoutGrid className="w-10 h-10" />,
  }
];

export default function App() {
  const [activeGame, setActiveGame] = useState<'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<GameTheme>('alphabet');

  const currentGame = GAMES.find(g => g.id === activeGame);

  return (
    <div className="min-h-screen bg-brand-dark font-sans selection:bg-brand-secondary overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, 100, 0],
              x: [0, 50, 0],
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              color: i % 2 === 0 ? '#6366f1' : '#f43f5e'
            }}
          >
            {i % 2 === 0 ? <Brain size={40 + i * 10} /> : <Sparkles size={40 + i * 10} />}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <header className="text-center mb-12 px-4">
                <motion.div
                  initial={{ y: -30 }}
                  animate={{ y: 0 }}
                  className="inline-flex items-center gap-3 bg-brand-primary/20 backdrop-blur-md px-8 py-4 rounded-full border-2 border-brand-primary mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                >
                  <Trophy className="text-brand-accent w-8 h-8 animate-bounce" />
                  <h1 className="text-5xl md:text-7xl font-display font-black tracking-widest text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                    ENGLISH GAME
                  </h1>
                  <Trophy className="text-brand-accent w-8 h-8 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </motion.div>
                
                {/* Theme Selector */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {Object.values(THEMES)
                    .filter(t => t.id !== 'tricky' && t.id !== 'food')
                    .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`px-6 py-3 rounded-2xl font-black transition-all ${
                        selectedTheme === t.id 
                          ? 'bg-brand-accent text-brand-dark scale-110 shadow-[0_0_20px_rgba(250,204,21,0.4)]' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </header>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl px-4">
                {GAMES.map((game, idx) => (
                  <motion.button
                    key={game.id}
                    onClick={() => setActiveGame(game.id as any)}
                    initial={{ x: idx % 2 === 0 ? -50 : 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${game.color} ${game.borderColor} border-b-[12px] p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 group cursor-pointer text-center relative overflow-hidden`}
                  >
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-12 -mt-16 pointer-events-none" />
                    <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-sm group-hover:scale-125 transition-transform duration-300">
                      {game.icon}
                    </div>
                    <div>
                      <h2 className="text-4xl font-display font-black text-white mb-2">{game.title}</h2>
                      <p className={`${game.accentColor} font-bold text-lg uppercase tracking-widest`}>
                        {game.subtitle}
                      </p>
                    </div>
                    <div className="mt-4 bg-black/20 px-6 py-2 rounded-full font-black text-white group-hover:bg-brand-accent group-hover:text-black transition-colors flex items-center gap-2">
                       PLAY QUEST <ChevronRight size={18} />
                    </div>
                  </motion.button>
                ))}
              </div>

              <footer className="mt-12 text-center opacity-50 text-white text-sm font-bold tracking-widest">
                MADE WITH GEMINI AI STUDIO BY NUTNUT17
              </footer>
            </motion.div>
          ) : (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex flex-col overflow-hidden"
            >
              {/* Game View */}
              {activeGame === 'v3' ? (
                <DetectGame 
                  theme={selectedTheme} 
                  title={currentGame?.title || ''}
                  subtitle={currentGame?.subtitle || ''}
                  onExit={() => setActiveGame(null)} 
                />
              ) : activeGame === 'v4' ? (
                <RevealGame 
                  theme={selectedTheme} 
                  title={currentGame?.title || ''}
                  subtitle={currentGame?.subtitle || ''}
                  onExit={() => setActiveGame(null)} 
                />
              ) : activeGame === 'v5' ? (
                <TrickyGame 
                  title={currentGame?.title || ''}
                  subtitle={currentGame?.subtitle || ''}
                  onExit={() => setActiveGame(null)} 
                />
              ) : activeGame === 'v6' ? (
                <RussianDollGame 
                  theme={selectedTheme} 
                  title={currentGame?.title || ''}
                  subtitle={currentGame?.subtitle || ''}
                  onExit={() => setActiveGame(null)} 
                />
              ) : activeGame === 'v7' ? (
                <TetrisGame 
                  title={currentGame?.title || ''}
                  subtitle={currentGame?.subtitle || ''}
                  onExit={() => setActiveGame(null)} 
                />
              ) : (
                <MemoryGame 
                  mode={activeGame as 'v1' | 'v2'} 
                  theme={selectedTheme} 
                  gridSize={4}
                  title={currentGame?.title || ''}
                  subtitle={currentGame?.subtitle || ''}
                  onExit={() => setActiveGame(null)} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

