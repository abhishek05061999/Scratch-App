import React from 'react';
import { Sprite } from '../types';

interface ToolbarProps {
  onAddSprite: () => void;
  onPlayAll: () => void;
  onStopAll: () => void;
  sprites: Sprite[];
  activeSprite: string;
  setActiveSprite: (id: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddSprite, 
  onPlayAll, 
  onStopAll, 
  sprites, 
  activeSprite, 
  setActiveSprite 
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-500 text-white shadow-md">
      <div className="flex items-center space-x-2">
        <button className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
          <span>← Back</span>
        </button>
      </div>
      
      <h1 className="text-xl font-bold">ScrAtch</h1>
      
      <div className="flex items-center space-x-2">
        <button className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar; 