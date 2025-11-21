import React from 'react';

interface TianZiGeProps {
  character: string;
  pinyin?: string;
  animate?: boolean;
  sizeClass?: string; // Allow parent to control size (e.g. "w-32 h-32" vs "w-64 h-64")
  textSizeClass?: string; // Allow parent to control font size
}

export const TianZiGe: React.FC<TianZiGeProps> = ({ 
  character, 
  pinyin, 
  animate = false,
  sizeClass = "w-64 h-64 md:w-80 md:h-80", // Default big size
  textSizeClass = "text-[160px] md:text-[200px]"
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${animate ? 'animate-fade-in-up' : ''}`}>
      {/* Pinyin Display - Scales somewhat with container but kept readable */}
      {pinyin && (
        <div className="text-2xl md:text-3xl font-bold text-gray-600 mb-2 font-sans tracking-widest">
          {pinyin}
        </div>
      )}

      {/* Grid Container */}
      <div className={`relative ${sizeClass} bg-white border-4 border-red-600 shadow-xl rounded-sm select-none transition-all duration-300`}>
        
        {/* Horizontal Dashed Line */}
        <div className="absolute top-1/2 left-0 w-full h-px border-t-2 border-red-300 border-dashed transform -translate-y-1/2 pointer-events-none" />
        
        {/* Vertical Dashed Line */}
        <div className="absolute top-0 left-1/2 h-full w-px border-l-2 border-red-300 border-dashed transform -translate-x-1/2 pointer-events-none" />

        {/* The Character */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${textSizeClass} leading-none text-black font-kaiti z-10`}>
            {character}
          </span>
        </div>
      </div>
    </div>
  );
};