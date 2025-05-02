import React from 'react';

interface SpriteRendererProps {
  name: string;
  isActive: boolean;
  color: string;
}

const SpriteRenderer: React.FC<SpriteRendererProps> = ({ name, isActive, color }) => {
  // Use an SVG cat sprite similar to the one in the image
  return (
    <div 
      className={`
        w-12 h-12 flex items-center justify-center rounded-md
        ${isActive ? 'ring-2 ring-blue-500' : ''}
        transition-all duration-300 overflow-hidden
      `}
      style={{ backgroundColor: color }}
    >
      {color === 'orange' ? (
        // Cat sprite (similar to Scratch cat)
        <svg viewBox="0 0 24 24" className="w-full h-full p-1">
          <path fill="#FFF" d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M16.5,8.65 c0.79,0,1.42,0.64,1.42,1.42c0,0.79-0.64,1.42-1.42,1.42c-0.79,0-1.42-0.64-1.42-1.42C15.08,9.29,15.71,8.65,16.5,8.65z M7.5,8.65 c0.79,0,1.42,0.64,1.42,1.42c0,0.79-0.64,1.42-1.42,1.42c-0.79,0-1.42-0.64-1.42-1.42C6.08,9.29,6.71,8.65,7.5,8.65z M12,18.5 c-3.31,0-6-2.69-6-6h12C18,15.81,15.31,18.5,12,18.5z"/>
        </svg>
      ) : (
        // Generic sprite circle for other sprites
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-800">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
};

export default SpriteRenderer; 