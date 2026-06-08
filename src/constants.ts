export type GameTheme = 'alphabet' | 'sea' | 'food' | 'toy' | 'tricky-sea' | 'tricky-toy';
export type GridSize = 2 | 3 | 4 | 5 | 6;

export interface ThemeConfig {
  id: GameTheme;
  label: string;
  extension?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    border: string;
  };
  images: string[];
}

export const THEMES: Record<GameTheme, ThemeConfig> = {
  alphabet: {
    id: 'alphabet',
    label: '🔤 Alphabets',
    colors: {
      primary: 'bg-indigo-600',
      secondary: 'bg-indigo-400',
      accent: 'text-indigo-200',
      bg: 'bg-indigo-950',
      border: 'border-indigo-700'
    },
    images: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] 
  },
  sea: {
    id: 'sea',
    label: '🌊 Deep Sea',
    extension: 'svg',
    colors: {
      primary: 'bg-cyan-600',
      secondary: 'bg-cyan-400',
      accent: 'text-cyan-200',
      bg: 'bg-cyan-950',
      border: 'border-cyan-700'
    },
    images: ['clam-svgrepo-com', 'coral-svgrepo-com', 'jellyfish-svgrepo-com', 'octopus-svgrepo-com', 'starfish-svgrepo-com', 'turtle-svgrepo-com', 'whale-svgrepo-com']
  },
  food: {
    id: 'food',
    label: '🍕 Yummy Food',
    extension: 'png',
    colors: {
      primary: 'bg-orange-600',
      secondary: 'bg-orange-400',
      accent: 'text-orange-200',
      bg: 'bg-orange-950',
      border: 'border-orange-700'
    },
    images: ['pizza', 'burger', 'apple', 'donut', 'cookie', 'taco', 'egg', 'banana']
  },
  toy: {
    id: 'toy',
    label: '🪀 Toy Box',
    extension: 'jpg',
    colors: {
      primary: 'bg-amber-600',
      secondary: 'bg-amber-400',
      accent: 'text-amber-200',
      bg: 'bg-amber-950',
      border: 'border-amber-700'
    },
    images: ['chinese-yoyo', 'kite', 'top', 'yoyo']
  },
  'tricky-sea': {
    id: 'tricky-sea',
    label: '🎭 Tricky Sea',
    extension: 'png',
    colors: {
      primary: 'bg-rose-600',
      secondary: 'bg-rose-400',
      accent: 'text-rose-200',
      bg: 'bg-rose-950',
      border: 'border-rose-700'
    },
    images: ['coral-starfish', 'jellyfish-octopus', 'turtle-whale']
  },
  'tricky-toy': {
    id: 'tricky-toy',
    label: '🎭 Tricky Toys',
    extension: 'png',
    colors: {
      primary: 'bg-rose-600',
      secondary: 'bg-rose-400',
      accent: 'text-rose-200',
      bg: 'bg-rose-950',
      border: 'border-rose-700'
    },
    images: ['kite-yoyo', 'top-yoyo']
  }
};
