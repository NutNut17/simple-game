import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, HelpCircle, Volume2, VolumeX, Sparkles, Trophy, ChevronLeft, ChevronRight, Zap, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface TetrisGameProps {
  title: string;
  subtitle: string;
  onExit: () => void;
}

interface CellConfig {
  origX: number; // 0..4
  origY: number; // 0..6
}

// Exactly 7 pentomino shapes partitioning a 5x7 grid (each having 5 blocks)
const BLOCKS_DEF: CellConfig[][] = [
  // Block 0: Upper-Left L-like corner
  [
    { origX: 0, origY: 0 },
    { origX: 1, origY: 0 },
    { origX: 2, origY: 0 },
    { origX: 0, origY: 1 },
    { origX: 0, origY: 2 }
  ],
  // Block 1: Upper-Right L-like corner
  [
    { origX: 3, origY: 0 },
    { origX: 4, origY: 0 },
    { origX: 3, origY: 1 },
    { origX: 4, origY: 1 },
    { origX: 4, origY: 2 }
  ],
  // Block 2: Middle-top T-like or flat bridge
  [
    { origX: 1, origY: 1 },
    { origX: 2, origY: 1 },
    { origX: 1, origY: 2 },
    { origX: 2, origY: 2 },
    { origX: 3, origY: 2 }
  ],
  // Block 3: Lower-Left Z-like / block
  [
    { origX: 0, origY: 3 },
    { origX: 1, origY: 3 },
    { origX: 0, origY: 4 },
    { origX: 1, origY: 4 },
    { origX: 2, origY: 4 }
  ],
  // Block 4: Lower-Right mirror Z-like / block
  [
    { origX: 2, origY: 3 },
    { origX: 3, origY: 3 },
    { origX: 4, origY: 3 },
    { origX: 3, origY: 4 },
    { origX: 4, origY: 4 }
  ],
  // Block 5: Bottom-Left stair / base
  [
    { origX: 0, origY: 5 },
    { origX: 1, origY: 5 },
    { origX: 0, origY: 6 },
    { origX: 1, origY: 6 },
    { origX: 2, origY: 6 }
  ],
  // Block 6: Bottom-Right stair / base
  [
    { origX: 2, origY: 5 },
    { origX: 3, origY: 5 },
    { origX: 4, origY: 5 },
    { origX: 3, origY: 6 },
    { origX: 4, origY: 6 }
  ]
];

// List of Russian-themed images to loop through
const IMAGES = [
  {
    path: `${import.meta.env.BASE_URL}themes/russia/russia.png`,
    desc: 'Iconic traditional architecture illustration.'
  },
  {
    path: `${import.meta.env.BASE_URL}themes/russia/ballet.png`,
    desc: 'Graceful classical ballet illustration.'
  },
  {
    path: `${import.meta.env.BASE_URL}themes/russia/russian-doll.png`,
    desc: 'Traditional nesting matryoshka doll illustration.'
  }
];

const getFilenameName = (path: string) => {
  const base = path.split('/').pop()?.split('.')[0] || '';
  return base.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const BOARD_COLS = 7;
const BOARD_ROWS = 10;
const OFFSET_X = 1;
const OFFSET_Y = 3;

// Order of spawn: 5,6 (base), then 3,4 (middle-bottom), then 2 (middle), then 0,1 (sides of top). Absolutely clear of blocking conflicts!
const ORDER_OF_SPAWN = [5, 6, 3, 4, 2, 0, 1];

interface ActiveBlock {
  id: number; // 0..6 (coincides with index in BLOCKS_DEF)
  rotationState: number; // 0=0deg, 1=90deg, 2=180deg, 3=270deg
  x: number; // Current board index column offset
  y: number; // Visual preview y tracking
  cells: {
    id: number;
    lx: number;
    ly: number;
    origX: number;
    origY: number;
  }[];
  targetX: number; // Solved target column offset
  targetY: number; // Solved target row offset
}

export default function TetrisGame({ title, subtitle, onExit }: TetrisGameProps) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [spawnQueueIndex, setSpawnQueueIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Board grid representing occupied cells [row][col]
  const [lockedBoard, setLockedBoard] = useState<boolean[][]>(
    Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(false))
  );
  const [lockedPieces, setLockedPieces] = useState<number[]>([]); // list of piece IDs already solved and locked

  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null);
  const [isFalling, setIsFalling] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'info' | 'error' | 'success' | null }>({
    message: '',
    type: null
  });

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // References and Web Audio variables
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<any>(null);
  const currentMelodyStep = useRef(0);

  const currentImage = IMAGES[currentImgIdx];

  // Korobeiniki melody note frequencies (Tetris theme!)
  const melodyNotes = [
    { note: 'E5', freq: 659.25, dur: 0.3 },
    { note: 'B4', freq: 493.88, dur: 0.15 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'D5', freq: 587.33, dur: 0.3 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'B4', freq: 493.88, dur: 0.15 },
    { note: 'A4', freq: 440.00, dur: 0.3 },
    { note: 'A4', freq: 440.00, dur: 0.15 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'E5', freq: 659.25, dur: 0.3 },
    { note: 'D5', freq: 587.33, dur: 0.15 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'B4', freq: 493.88, dur: 0.45 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'D5', freq: 587.33, dur: 0.3 },
    { note: 'E5', freq: 659.25, dur: 0.3 },
    { note: 'C5', freq: 523.25, dur: 0.3 },
    { note: 'A4', freq: 440.00, dur: 0.3 },
    { note: 'A4', freq: 440.00, dur: 0.6 },
    
    // Part 2 of the loop
    { note: 'D5', freq: 587.33, dur: 0.45 },
    { note: 'F5', freq: 698.46, dur: 0.15 },
    { note: 'A5', freq: 880.00, dur: 0.3 },
    { note: 'G5', freq: 783.99, dur: 0.15 },
    { note: 'F5', freq: 698.46, dur: 0.15 },
    { note: 'E5', freq: 659.25, dur: 0.45 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'E5', freq: 659.25, dur: 0.3 },
    { note: 'D5', freq: 587.33, dur: 0.15 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'B4', freq: 493.88, dur: 0.3 },
    { note: 'B4', freq: 493.88, dur: 0.15 },
    { note: 'C5', freq: 523.25, dur: 0.15 },
    { note: 'D5', freq: 587.33, dur: 0.3 },
    { note: 'E5', freq: 659.25, dur: 0.3 },
    { note: 'C5', freq: 523.25, dur: 0.3 },
    { note: 'A4', freq: 440.00, dur: 0.3 },
    { note: 'A4', freq: 440.00, dur: 0.6 }
  ];

  // Web Audio Context initializer
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
  };

  // Sound effects generator
  const playSound = (type: 'rotate' | 'move' | 'land' | 'success' | 'fail' | 'levelcomplete') => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'move') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'rotate') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'land') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.06, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.2);
        });
      } else if (type === 'fail') {
        const now = ctx.currentTime;
        const notes = [220.00, 180.00]; // A3, F3#
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.06, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.2);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.22);
        });
      } else if (type === 'levelcomplete') {
        const now = ctx.currentTime;
        // Fancy major celebratory fan-fare!
        const fan = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        fan.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.07, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.45);
        });
      }
    } catch (e) {
      console.warn('Web Audio fail:', e);
    }
  };

  // Custom retro retro music play callback
  const playMelodyStep = () => {
    if (!musicEnabled || !soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const step = currentMelodyStep.current;
      const item = melodyNotes[step];
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.012, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + item.dur - 0.02);
      
      osc.start();
      osc.stop(ctx.currentTime + item.dur);
      
      currentMelodyStep.current = (step + 1) % melodyNotes.length;
      
      // Schedule next note precisely
      musicIntervalRef.current = setTimeout(playMelodyStep, item.dur * 1000);
    } catch (e) {
      console.warn(e);
    }
  };

  // Music switch handler
  useEffect(() => {
    if (musicEnabled && soundEnabled) {
      currentMelodyStep.current = 0;
      playMelodyStep();
    } else {
      if (musicIntervalRef.current) {
        clearTimeout(musicIntervalRef.current);
        musicIntervalRef.current = null;
      }
    }
    return () => {
      if (musicIntervalRef.current) {
        clearTimeout(musicIntervalRef.current);
      }
    };
  }, [musicEnabled, soundEnabled]);

  // Rotates block local coordinates 90 degrees clockwise and normalizes
  const rotateBlockCells = (cells: ActiveBlock['cells']): ActiveBlock['cells'] => {
    let maxLy = 0;
    cells.forEach(c => {
      if (c.ly > maxLy) maxLy = c.ly;
    });

    // 90 deg rotation around bounding axes
    const rotated = cells.map(c => ({
      ...c,
      lx: maxLy - c.ly,
      ly: c.lx
    }));

    // Find bounding minima to normalize top-left to 0,0
    let minLx = Infinity;
    let minLy = Infinity;
    rotated.forEach(c => {
      if (c.lx < minLx) minLx = c.lx;
      if (c.ly < minLy) minLy = c.ly;
    });

    return rotated.map(c => ({
      ...c,
      lx: c.lx - minLx,
      ly: c.ly - minLy
    }));
  };

  // Generate the active block
  const spawnBlock = (pieceIndex: number) => {
    if (pieceIndex >= ORDER_OF_SPAWN.length) {
      // Game solved completely for this level!
      handleLevelComplete();
      return;
    }

    const blockId = ORDER_OF_SPAWN[pieceIndex];
    const def = BLOCKS_DEF[blockId];

    // Determine target coordinate info
    const targetX = Math.min(...def.map(c => c.origX));
    const targetY = Math.min(...def.map(c => c.origY));

    // Form local coordinates list
    let cells = def.map((c, index) => ({
      id: index,
      origX: c.origX,
      origY: c.origY,
      lx: c.origX - Math.min(...def.map(d => d.origX)),
      ly: c.origY - Math.min(...def.map(d => d.origY))
    }));

    // Randomize initial rotation (0..3)
    const initialRotationsCount = Math.floor(Math.random() * 4);
    for (let r = 0; r < initialRotationsCount; r++) {
      cells = rotateBlockCells(cells);
    }

    const width = Math.max(...cells.map(c => c.lx)) + 1;
    // Set a reasonable random starting column index
    const startX = Math.floor(Math.random() * (BOARD_COLS - width + 1));

    setActiveBlock({
      id: blockId,
      rotationState: initialRotationsCount % 4,
      x: startX,
      y: 0,
      cells,
      targetX,
      targetY
    });
    setIsFalling(false);
  };

  // Handles placing/locking the entire puzzle board when solved
  const handleLevelComplete = () => {
    playSound('levelcomplete');
    setIsFinished(true);
    setScore(prev => prev + 100);
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    if (nextStreak > highScore) {
      setHighScore(nextStreak);
    }
    setFeedback({
      message: 'Great Job! All blocks slot back into place perfectly!',
      type: 'success'
    });
  };

  // Start Level
  const initLevel = (imgIdx: number) => {
    setLockedBoard(Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(false)));
    setLockedPieces([]);
    setSpawnQueueIndex(0);
    setIsFinished(false);
    setIsFalling(false);
    setFeedback({
      message: '',
      type: null
    });
    
    // Spawn initial block
    // Clear out active block first to trigger clean mounting
    setActiveBlock(null);
    setCurrentImgIdx(imgIdx);
  };

  // Trigger level spawn on initial load
  useEffect(() => {
    initLevel(currentImgIdx);
  }, [currentImgIdx]);

  // Handle spawning blocks as queue index advances
  useEffect(() => {
    if (spawnQueueIndex === 0 && lockedPieces.length === 0) {
      spawnBlock(0);
    } else if (spawnQueueIndex > 0) {
      spawnBlock(spawnQueueIndex);
    }
  }, [spawnQueueIndex]);

  // Calculating visual landing Y position based on current board state
  const calculateLandingY = (blockX: number, blockCells: ActiveBlock['cells']): number => {
    let finalY = 0;
    // Walk down row levels
    for (let currentY = 0; currentY <= BOARD_ROWS; currentY++) {
      let collision = false;
      for (const cell of blockCells) {
        const boardX = blockX + cell.lx;
        const boardY = currentY + cell.ly;
        
        // Out of board height limits, or colliding with locked tiles
        if (boardY >= BOARD_ROWS || (boardY >= 0 && (boardX >= BOARD_COLS || lockedBoard[boardY][boardX]))) {
          collision = true;
          break;
        }
      }
      if (collision) {
        break;
      }
      finalY = currentY;
    }
    return finalY;
  };

  // Move operations
  const moveLeft = () => {
    if (!activeBlock || isFalling || isFinished) return;
    if (activeBlock.x > 0) {
      setActiveBlock(prev => {
        if (!prev) return null;
        return { ...prev, x: prev.x - 1 };
      });
      playSound('move');
    }
  };

  const moveRight = () => {
    if (!activeBlock || isFalling || isFinished) return;
    const width = Math.max(...activeBlock.cells.map(c => c.lx)) + 1;
    if (activeBlock.x + width < BOARD_COLS) {
      setActiveBlock(prev => {
        if (!prev) return null;
        return { ...prev, x: prev.x + 1 };
      });
      playSound('move');
    }
  };

  const rotate = () => {
    if (!activeBlock || isFalling || isFinished) return;
    const nextCells = rotateBlockCells(activeBlock.cells);
    const width = Math.max(...nextCells.map(c => c.lx)) + 1;
    
    // Ensure block is clipped inside board boundaries
    let nextX = activeBlock.x;
    if (nextX + width > BOARD_COLS) {
      nextX = BOARD_COLS - width;
    }

    setActiveBlock(prev => {
      if (!prev) return null;
      return {
        ...prev,
        x: nextX,
        rotationState: (prev.rotationState + 1) % 4,
        cells: nextCells
      };
    });
    playSound('rotate');
  };

  // Drop action
  const handlePut = () => {
    if (!activeBlock || isFalling || isFinished) return;

    setIsFalling(true);
    const landY = calculateLandingY(activeBlock.x, activeBlock.cells);

    // Animate active block falling
    let currentYVal = 0;
    const animInterval = setInterval(() => {
      currentYVal += 0.5;
      if (currentYVal >= landY) {
        clearInterval(animInterval);
        finalizeLanding(activeBlock.x, landY, activeBlock);
      } else {
        setActiveBlock(prev => {
          if (!prev) return null;
          return { ...prev, y: currentYVal };
        });
      }
    }, 25);
  };

  // Perform validation check once block lands
  const finalizeLanding = (finalX: number, finalY: number, block: ActiveBlock) => {
    playSound('land');
    
    const isCorrectPos = finalX === block.targetX + OFFSET_X && finalY === block.targetY + OFFSET_Y;
    const isCorrectRotation = block.rotationState === 0;

    if (isCorrectPos && isCorrectRotation) {
      // Solved! Permanently lock piece onto board
      setLockedPieces(prev => [...prev, block.id]);
      
      setLockedBoard(prev => {
        const nextBoard = prev.map(row => [...row]);
        block.cells.forEach(cell => {
          const bX = finalX + cell.lx;
          const bY = finalY + cell.ly;
          if (bY >= 0 && bY < BOARD_ROWS && bX >= 0 && bX < BOARD_COLS) {
            nextBoard[bY][bX] = true;
          }
        });
        return nextBoard;
      });

      playSound('success');
      setFeedback({
        message: 'Masterful! Block locked in place perfectly.',
        type: 'success'
      });

      // Clear active details and advance queue index
      setTimeout(() => {
        setSpawnQueueIndex(prev => prev + 1);
        setIsFalling(false);
      }, 300);

    } else {
      // Incorrect slot! Display error feedback, wiggle block, bounce back to starting point
      playSound('fail');
      
      let errMsg = '';
      if (!isCorrectRotation) {
        errMsg = 'The image needs to be turned! Keep turning it until the painting faces upright.';
      } else {
        errMsg = 'Collision mismatch! This block belongs to another coordinate. Go left or right.';
      }

      setFeedback({
        message: errMsg,
        type: 'error'
      });

      // Reset block visual offsets and return to pool
      setTimeout(() => {
        setActiveBlock(prev => {
          if (!prev) return null;
          return { ...prev, y: 0 };
        });
        setIsFalling(false);
      }, 1000);
    }
  };

  // Navigation callbacks
  const handleNextImage = () => {
    const nextIdx = (currentImgIdx + 1) % IMAGES.length;
    initLevel(nextIdx);
  };

  const handleRestart = () => {
    initLevel(currentImgIdx);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#110e2e] text-white overflow-hidden relative w-full h-full font-sans">
      
      {/* Decorative Top header panel with Change Game button */}
      <header className="bg-gradient-to-r from-red-700 via-rose-600 to-amber-600 p-4 border-b-4 border-black/30 flex justify-between items-center shadow-2xl relative z-10 selection:bg-amber-400">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="bg-red-800 hover:bg-red-700 px-4 py-2 rounded-xl flex items-center gap-2 font-display font-bold text-sm tracking-wider uppercase border border-white/10 active:scale-95 transition-all text-white"
            id="change-game-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>CHANGE GAME</span>
          </button>
          
          <div className="hidden md:block">
            <h1 className="font-display font-black text-2xl tracking-wider text-white select-none">
              RUSSIAN CHRONO TETRIS
            </h1>
            <p className="text-[10px] text-amber-200 uppercase tracking-widest font-bold leading-none">
              {title} • {subtitle}
            </p>
          </div>
        </div>

        {/* Audio controls & stats */}
        <div className="flex items-center gap-4">
          
          {/* Audio controls */}
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 items-center gap-1">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playSound('move');
              }}
              className={`p-1.5 rounded-lg transition-all ${soundEnabled ? 'bg-white/10 text-amber-300' : 'text-white/40'}`}
              title="Toggle Sound FX"
              id="sound-fx-btn"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => {
                setMusicEnabled(!musicEnabled);
                initAudio();
              }}
              className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${musicEnabled ? 'bg-amber-400 text-black' : 'text-white/40 hover:text-white'}`}
              title="Play Synth Theme music"
              id="music-theme-btn"
            >
              KOROBEINIKI 🎵
            </button>
          </div>

          {/* Sparkly score displays */}
          <div className="bg-black/35 px-4 py-1.5 rounded-2xl border border-white/10 flex items-center gap-3 text-xs leading-none">
            <div>
              <span className="text-[9px] text-white/40 font-bold block uppercase tracking-wide">Streak</span>
              <span className="font-display font-black text-lg text-amber-300 mt-1 block">{streak} 🔥</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-[9px] text-white/40 font-bold block uppercase tracking-wide">Best</span>
              <span className="font-display font-black text-lg text-white mt-1 block">{highScore} 🏆</span>
            </div>
          </div>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 bg-black/20 hover:bg-black/30 text-white/80 rounded-xl"
            title="How to Play"
            id="how-to-play-toggle"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Game Contents */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-y-auto lg:overflow-hidden relative items-stretch max-w-7xl mx-auto w-full">
        
        {/* Left column: References of Image solution */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Card: Current painting */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
            <div className="flex justify-between items-center">
              <h2 className="text-[#facc15] font-display font-black uppercase tracking-widest text-xs">
                Target Masterpiece
              </h2>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                {7 - lockedPieces.length} Left
              </span>
            </div>
            
            <div className="relative aspect-[5/7] w-full rounded-2xl overflow-hidden border-2 border-[#ff4766] shadow-[0_4px_20px_rgba(255,100,100,0.15)] group">
              <img
                src={currentImage.path}
                alt={getFilenameName(currentImage.path)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 pointer-events-none">
                <p className="text-white text-md font-display font-bold leading-tight">{getFilenameName(currentImage.path)}</p>
                <p className="text-white/60 text-[10px] truncate leading-none mt-1">{currentImage.desc}</p>
              </div>
            </div>

            {/* Hint control under map */}
            <button
              onClick={() => {
                setShowHint(!showHint);
                playSound('move');
              }}
              className="mt-1 bg-black/25 hover:bg-black/40 text-[11px] py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/5 text-white/80"
              id="hint-toggle-btn"
            >
              {showHint ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Grid Underlay Hint</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Overlay Grid Underlay Hint</span>
                </>
              )}
            </button>

            {/* Compact pieces queue indicators inside card */}
            <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2">
              <span className="text-white/40 text-[9px] font-black uppercase tracking-widest text-center">
                Pieces Queue Order
              </span>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {ORDER_OF_SPAWN.map((id, index) => {
                  const isLocked = lockedPieces.includes(id);
                  const isActive = activeBlock?.id === id;
                  return (
                    <div
                      key={id}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold border transition-all ${
                        isActive
                          ? 'bg-amber-400 border-amber-300 text-black shadow-md shadow-amber-400/20'
                          : isLocked
                            ? 'bg-[#10b981]/20 border-[#10b981]/30 text-emerald-400 line-through'
                            : 'bg-zinc-800/40 border-zinc-700/20 text-white/40'
                      }`}
                      title={isLocked ? 'Solved' : isActive ? 'Active' : 'Queued'}
                    >
                      {index + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Center column: Game Active Board */}
        <div className="lg:col-span-6 flex flex-col items-center justify-start gap-4">
          
          {/* Main Visual Stacking Stage - Compact layout to avoid wasting space */}
          <div className="relative w-full flex flex-col items-center justify-center py-1">
            
            {/* 7 columns x 10 rows grid board container */}
            <div 
              className="relative h-[calc(100vh-210px)] lg:h-[calc(100vh-220px)] max-h-[580px] min-h-[380px] aspect-[7/10] w-auto border-4 border-amber-600/70 rounded-2xl bg-[#09071c] shadow-2xl overflow-hidden" 
            >
              {/* Solution Underlay Guide Map (placed inside columns 1..5 of 7 total columns, starting at row 3 of 10 total rows) */}
              {showHint && !isFinished && (
                <div 
                  className="absolute opacity-[0.22] pointer-events-none select-none duration-500"
                  style={{
                    left: `${(OFFSET_X / BOARD_COLS) * 100}%`,
                    width: `${(5 / BOARD_COLS) * 100}%`,
                    top: `${(OFFSET_Y / BOARD_ROWS) * 100}%`,
                    height: `${(7 / BOARD_ROWS) * 100}%`,
                  }}
                >
                  <img
                    src={currentImage.path}
                    alt="hint-background"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Decorative grid outline lines (BOARD_COLS columns x BOARD_ROWS rows) */}
              <div 
                className="absolute inset-0 grid pointer-events-none"
                style={{
                  gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${BOARD_ROWS}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: BOARD_COLS * BOARD_ROWS }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/5" />
                ))}
              </div>

              {/* RENDER ALREADY LOCKED PERMANENT TILES */}
              {BLOCKS_DEF.map((blockCells, blockId) => {
                const isLocked = lockedPieces.includes(blockId);
                if (!isLocked) return null;

                // Render all 5 cells of this locked block in full beautiful color!
                return blockCells.map((c, cellIdx) => (
                  <div
                    key={`${blockId}-locked-${cellIdx}`}
                    className="absolute bg-[#0c0a22] border-2 border-emerald-500/60 transition-all rounded-[4px] shadow-md shadow-emerald-500/10"
                    style={{
                      width: `${100 / BOARD_COLS}%`,
                      height: `${100 / BOARD_ROWS}%`,
                      left: `${(c.origX + OFFSET_X) * (100 / BOARD_COLS)}%`,
                      top: `${(c.origY + OFFSET_Y) * (100 / BOARD_ROWS)}%`,
                    }}
                  >
                    {/* Locked full colored block thumbnail of the painting */}
                    <div
                      className="w-full h-full relative"
                      style={{
                        backgroundImage: `url(${currentImage.path})`,
                        backgroundSize: '500% 700%',
                        backgroundPosition: `${(c.origX / 4) * 100}% ${(c.origY / 6) * 100}%`
                      }}
                    />
                  </div>
                ));
              })}

              {/* RENDER CURRENT RE-POSITIONABLE ACTIVE BLOCK */}
              <AnimatePresence>
                {activeBlock && !isFinished && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}
                  >
                    {activeBlock.cells.map((cell) => {
                      // Work out current grid position relative to parent X and preview/animating Y
                      const gridX = activeBlock.x + cell.lx;
                      const gridY = activeBlock.y + cell.ly;

                      return (
                        <motion.div
                          key={cell.id}
                          className="absolute border-[2px] border-amber-400 bg-zinc-900 rounded-[6px] shadow-lg flex items-center justify-center overflow-hidden"
                          style={{
                            width: `${100 / BOARD_COLS}%`,
                            height: `${100 / BOARD_ROWS}%`,
                            left: `${gridX * (100 / BOARD_COLS)}%`,
                            top: `${gridY * (100 / BOARD_ROWS)}%`,
                            transform: `rotate(${activeBlock.rotationState * 90}deg)`
                          }}
                          layout
                          id={`active-cell-${cell.id}`}
                        >
                          {/* Part of the Russia/Ballet painting cropped! */}
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url(${currentImage.path})`,
                              backgroundSize: '500% 700%',
                              backgroundPosition: `${(cell.origX / 4) * 100}% ${(cell.origY / 6) * 100}%`,
                              // Compensate the texture rotation so the painting pieces correctly orient in standard rotation=0!
                              transform: `rotate(${-activeBlock.rotationState * 90}deg)`,
                              transformOrigin: 'center'
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>

              {/* RENDER FALLING GHOST / PROJECTED LANDING POSITION PREVIEW */}
              {activeBlock && !isFalling && !isFinished && (
                <div className="absolute inset-0 pointer-events-none">
                  {activeBlock.cells.map((cell) => {
                    const shadowX = activeBlock.x + cell.lx;
                    const shadowY = calculateLandingY(activeBlock.x, activeBlock.cells) + cell.ly;
                    
                    return (
                      <div
                        key={cell.id}
                        className="absolute border-2 border-dashed border-cyan-400/30 bg-cyan-400/5 rounded-[6px]"
                        style={{
                          width: `${100 / BOARD_COLS}%`,
                          height: `${100 / BOARD_ROWS}%`,
                          left: `${shadowX * (100 / BOARD_COLS)}%`,
                          top: `${shadowY * (100 / BOARD_ROWS)}%`,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Solved overlay celebration cards */}
              <AnimatePresence>
                {isFinished && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 z-20 flex flex-col justify-center items-center p-6 text-center"
                    id="finish-overlay"
                  >
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-amber-400 text-black text-2xl flex items-center justify-center rounded-2xl mb-4 shadow-lg shadow-amber-500/30 animate-pulse">
                        👑
                      </div>
                      
                      <h2 className="font-display font-black text-2xl text-[#facc15] tracking-widest leading-none">
                        LEVEL SOLVED!
                      </h2>
                      <p className="text-white/60 text-xs mt-2 uppercase tracking-wide">
                        You rebuilt: {getFilenameName(currentImage.path)}
                      </p>

                      <div className="my-5 w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2 text-left">
                        <div className="flex justify-between font-bold">
                          <span className="text-white/40">Moves Category:</span>
                          <span className="text-white">Deterministic Stacking</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-white/40">Streak History:</span>
                          <span className="text-amber-400">{streak} Levels Solved</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={handleNextImage}
                          className="bg-amber-400 text-black hover:bg-amber-300 py-3 px-6 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all select-none w-full shadow-lg"
                          id="next-level-btn"
                        >
                          Next Masterpiece 🌟
                        </button>
                        <button
                          onClick={onExit}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white hover:text-amber-300 py-2.5 px-6 rounded-2xl font-display font-bold text-xs uppercase tracking-wider transition-all select-none w-full border border-white/10"
                          id="change-game-overlay-btn"
                        >
                          Change Game Mode 🎮
                        </button>
                        <button
                          onClick={handleRestart}
                          className="text-white/40 hover:text-white py-2 text-xs font-bold"
                          id="play-again-btn"
                        >
                          Replay Level
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {feedback.message && feedback.type && (
            <div className={`w-full max-w-[325px] p-2.5 rounded-2xl border text-center text-xs font-bold leading-normal transition-all relative overflow-hidden backdrop-blur-md ${
              feedback.type === 'error' 
                ? 'bg-red-950/40 border-red-500/50 text-red-200 shadow-lg shadow-red-500/10' 
                : feedback.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                  : 'bg-indigo-950/30 border-indigo-700/30 text-indigo-200'
            }`} id="game-feedback-banner">
              <span className="relative z-10">{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Right column: Action Controls Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4 justify-start">
          
          {/* Interactive Button interface controls */}
          <div className="bg-[#18133e] border border-amber-600/20 rounded-[32px] p-5 flex flex-col gap-4 shadow-xl max-w-sm mx-auto lg:max-w-none w-full">
            
            {/* Shift controls */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={moveLeft}
                disabled={!activeBlock || isFalling || isFinished}
                className="bg-indigo-950/80 p-5 rounded-2xl hover:bg-indigo-950 border border-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-white flex flex-col items-center justify-center gap-1.5"
                title="Go Active Block Left"
                id="ctrl-shift-left"
              >
                <ChevronLeft className="w-8 h-8 text-amber-300" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Go Left</span>
              </button>
              
              <button
                onClick={moveRight}
                disabled={!activeBlock || isFalling || isFinished}
                className="bg-indigo-950/80 p-5 rounded-2xl hover:bg-indigo-950 border border-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-white flex flex-col items-center justify-center gap-1.5"
                title="Go Active Block Right"
                id="ctrl-shift-right"
              >
                <ChevronRight className="w-8 h-8 text-amber-300" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Go Right</span>
              </button>
            </div>

            {/* Rotation controls */}
            <button
              onClick={rotate}
              disabled={!activeBlock || isFalling || isFinished}
              className="bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-display font-black tracking-wider uppercase active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
              title="Turn Piece 90 Deg"
              id="ctrl-rotate"
            >
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
              <span>Turn</span>
            </button>

            {/* Big Lock/Put controller */}
            <button
              onClick={handlePut}
              disabled={!activeBlock || isFalling || isFinished}
              className="bg-rose-600 hover:bg-rose-500 text-white py-5 px-4 rounded-3xl font-display font-black text-lg tracking-widest uppercase active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex h-24 items-center justify-center gap-2.5 shadow-xl shadow-rose-600/20"
              title="Drop piece and lock to board"
              id="ctrl-put"
            >
              <Zap className="w-6 h-6 animate-bounce" />
              <span>PUT / DROP</span>
            </button>

            {/* Reset current level */}
            <button
              onClick={handleRestart}
              className="border border-white/10 hover:bg-white/5 text-white/50 hover:text-white py-2.5 rounded-xl font-bold text-xs transition-colors mt-2"
              id="ctrl-restart"
            >
              Reset masterpiece board
            </button>
          </div>
        </div>
      </div>

      {/* Help Instructions overlay modal modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#18153c] border-2 border-amber-500 rounded-[36px] max-w-sm w-full p-6 text-center shadow-3xl text-white"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-display font-black text-xl text-amber-300 uppercase tracking-widest mb-3">
                Russia Tetris Puzzle
              </h3>
              <p className="text-white/70 text-xs leading-relaxed mb-4">
                This game takes Russian photographs and splits them into Tetris shapes.
              </p>
              
              <div className="space-y-3 text-left text-xs bg-black/40 p-4 rounded-2xl border border-white/5">
                <p>
                  1. <strong className="text-pink-400">Match the Picture:</strong> Turn the shape until the dancer, doll or cathedral faces properly vertical.
                </p>
                <p>
                  2. <strong className="text-pink-400">Place the Brick:</strong> Go left or right to align with where the piece sits.
                </p>
                <p>
                  3. <strong className="text-pink-400">Commit Landing:</strong> Click <strong>PUT</strong> to drop the block. If oriented correctly, it locks permanently.
                </p>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="mt-5 bg-amber-400 text-black py-2.5 px-6 rounded-xl font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition-all w-full"
                id="help-close-btn"
              >
                Let's Stacking!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
