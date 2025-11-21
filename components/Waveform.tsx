import React from 'react';

export const Waveform: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-1 h-12">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-2 bg-blue-500 rounded-full animate-bounce"
          style={{
            height: '60%',
            animationDuration: `${0.6 + i * 0.1}s`,
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
    </div>
  );
};
