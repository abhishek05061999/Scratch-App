import React, { useState, useEffect, useRef } from 'react';
import BlocksPanel from './BlocksPanel';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import { Sprite, Block } from '../types';

const ScratchEditor: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [sprites, setSprites] = useState<Sprite[]>([
    {
      id: 'sprite1',
      name: 'Cat',
      x: 0,
      y: 0,
      image: '',
      color: 'orange',
      blocks: [],
      isRunning: false,
      steps: 10
    }
  ]);
  
  const [activeSprite, setActiveSprite] = useState<string>('sprite1');
  const [selectedTab, setSelectedTab] = useState<'code' | 'action'>('code');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Set up canvas size and add resize listener
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Force another update after a short delay to ensure all styles are applied
    const timeoutId = setTimeout(updateCanvasSize, 100);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Add a new sprite
  const addSprite = () => {
    const newSprite: Sprite = {
      id: `sprite${sprites.length + 1}`,
      name: `Sprite ${sprites.length + 1}`,
      x: 0,
      y: 0,
      image: '',
      color: 'blue',
      blocks: [],
      isRunning: false,
      steps: -10
    };
    
    setSprites([...sprites, newSprite]);
    setActiveSprite(newSprite.id);
  };
  
  // Add block to the active sprite
  const addBlockToSprite = (block: Block) => {
    setSprites(sprites.map(sprite => 
      sprite.id === activeSprite 
        ? { ...sprite, blocks: [...sprite.blocks, block] } 
        : sprite
    ));
  };
  
  // Play all sprite animations
  const playAll = () => {
    setSprites(sprites.map(sprite => ({
      ...sprite,
      isRunning: true
    })));
  };
  
  // Stop all sprite animations
  const stopAll = () => {
    setSprites(sprites.map(sprite => ({
      ...sprite,
      isRunning: false
    })));
  };
  
  // Hero Feature: Check collision between sprites and swap animations
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (sprites.length < 2 || !sprites.some(sprite => sprite.isRunning)) {
        return;
      }
      
      const collidingPairs: [string, string][] = [];
      
      // Check for collisions
      for (let i = 0; i < sprites.length; i++) {
        for (let j = i + 1; j < sprites.length; j++) {
          const sprite1 = sprites[i];
          const sprite2 = sprites[j];
          
          // Simple rectangle collision detection
          const dx = Math.abs(sprite1.x - sprite2.x);
          const dy = Math.abs(sprite1.y - sprite2.y);
          
          // Assume sprite size of 50x50
          if (dx < 50 && dy < 50) {
            collidingPairs.push([sprite1.id, sprite2.id]);
          }
        }
      }
      
      // Handle collisions - Hero Feature
      if (collidingPairs.length > 0) {
        // Create a copy of sprites to work with
        const updatedSprites = [...sprites];
        
        collidingPairs.forEach(([id1, id2]) => {
          const index1 = updatedSprites.findIndex(s => s.id === id1);
          const index2 = updatedSprites.findIndex(s => s.id === id2);
          
          if (index1 >= 0 && index2 >= 0) {
            const sprite1 = updatedSprites[index1];
            const sprite2 = updatedSprites[index2];
            
            // Check if either sprite has hero collision block enabled
            const heroEnabled1 = sprite1.blocks.some(b => 
              b.type === 'events' && b.action === 'heroCollision' && b.params.enabled === 'true'
            );
            
            const heroEnabled2 = sprite2.blocks.some(b => 
              b.type === 'events' && b.action === 'heroCollision' && b.params.enabled === 'true'
            );
            
            if (heroEnabled1 || heroEnabled2) {
              // Save the steps values
              const steps1 = sprite1.steps || 10;
              const steps2 = sprite2.steps || -10;
              
              // Swap the steps values
              updatedSprites[index1] = { ...sprite1, steps: steps2 };
              updatedSprites[index2] = { ...sprite2, steps: steps1 };
              
              // Update move blocks to reflect the new steps
              updatedSprites[index1].blocks = sprite1.blocks.map(block => {
                if (block.type === 'motion' && block.action === 'move') {
                  return { 
                    ...block, 
                    params: { 
                      ...block.params, 
                      steps: steps2
                    } 
                  };
                }
                return block;
              });
              
              updatedSprites[index2].blocks = sprite2.blocks.map(block => {
                if (block.type === 'motion' && block.action === 'move') {
                  return { 
                    ...block, 
                    params: { 
                      ...block.params, 
                      steps: steps1
                    } 
                  };
                }
                return block;
              });
            } else {
              // Basic collision response - reverse directions
              updatedSprites[index1].blocks = sprite1.blocks.map(block => {
                if (block.type === 'motion' && block.action === 'move') {
                  return { 
                    ...block, 
                    params: { 
                      ...block.params, 
                      steps: -Number(block.params.steps) 
                    } 
                  };
                }
                return block;
              });
              
              updatedSprites[index2].blocks = sprite2.blocks.map(block => {
                if (block.type === 'motion' && block.action === 'move') {
                  return { 
                    ...block, 
                    params: { 
                      ...block.params, 
                      steps: -Number(block.params.steps) 
                    } 
                  };
          }
                return block;
              });
            }
          }
        });
        
        setSprites(updatedSprites);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [sprites]);
  
  const activeSpriteName = sprites.find(s => s.id === activeSprite)?.name || 'Sprite';
  const x = Math.round(sprites.find(s => s.id === activeSprite)?.x || 0);
  const y = Math.round(sprites.find(s => s.id === activeSprite)?.y || 0);
  
  // Transform screen coordinates to Scratch coordinate system
  const transformToScratchCoords = (sprite: Sprite, canvasWidth: number, canvasHeight: number) => {
    // Calculate the center of the canvas
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // In Scratch, (0,0) is center, +y is up, +x is right
    return {
      left: `${centerX + sprite.x - 25}px`,
      top: `${centerY - sprite.y - 25}px`, // subtract y because y-axis is inverted
    };
  };
  
  // Main UI rendering
  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation */}
      <Toolbar 
        onAddSprite={addSprite} 
        onPlayAll={playAll} 
        onStopAll={stopAll}
        sprites={sprites}
        activeSprite={activeSprite}
        setActiveSprite={setActiveSprite}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col bg-blue-500 overflow-hidden">
        {/* Sprite canvas area */}
        <div 
          ref={canvasContainerRef}
          className="flex-1 bg-white m-3 rounded-md relative overflow-hidden"
        >
          {/* Coordinate axes */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 opacity-50" style={{ zIndex: 1 }}></div>
          <div className="absolute bottom-0 top-0 left-1/2 w-0.5 bg-gray-200 opacity-50" style={{ zIndex: 1 }}></div>
          
          {sprites.map(sprite => {
            const centerX = canvasSize.width / 2;
            const centerY = canvasSize.height / 2;
            
            // Position sprite relative to center (0,0)
            const left = centerX + sprite.x - 25; // subtract half sprite width
            const top = centerY - sprite.y - 25;  // subtract half sprite height and invert y-axis
            
            return (
              <div
                key={sprite.id}
                className={`absolute cursor-pointer ${activeSprite === sprite.id ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: '50px',
                  height: '50px',
                  zIndex: 2
                }}
                onClick={() => setActiveSprite(sprite.id)}
              >
                <div className={`w-full h-full flex items-center justify-center rounded-md`} style={{ backgroundColor: sprite.color }}>
                  {sprite.color === 'orange' ? (
                    <svg viewBox="0 0 24 24" className="w-full h-full p-1">
                      <path fill="#FFF" d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M16.5,8.65 c0.79,0,1.42,0.64,1.42,1.42c0,0.79-0.64,1.42-1.42,1.42c-0.79,0-1.42-0.64-1.42-1.42C15.08,9.29,15.71,8.65,16.5,8.65z M7.5,8.65 c0.79,0,1.42,0.64,1.42,1.42c0,0.79-0.64,1.42-1.42,1.42c-0.79,0-1.42-0.64-1.42-1.42C6.08,9.29,6.71,8.65,7.5,8.65z M12,18.5 c-3.31,0-6-2.69-6-6h12C18,15.81,15.31,18.5,12,18.5z"/>
                    </svg>
                  ) : (
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-800">
                      {sprite.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Play button in bottom right */}
          <button 
            className="absolute bottom-5 right-5 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg"
            onClick={playAll}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        {/* Sprite info and code area */}
        <div className="h-60 flex mx-3 mb-3">
          {/* Sprite info */}
          <div className="flex flex-col space-y-2 bg-white p-2 rounded-l-md w-32">
            <div className="text-lg font-bold">Sprite</div>
            <input 
              type="text" 
              value={activeSpriteName} 
              readOnly 
              className="border border-gray-300 px-2 py-1 rounded"
            />
            <div className="flex items-center">
              <label className="font-bold mr-2">X</label>
              <input 
                type="number" 
                value={x} 
                readOnly
                className="border border-gray-300 px-2 py-1 rounded w-16"
              />
            </div>
            <div className="flex items-center">
              <label className="font-bold mr-2">Y</label>
              <input 
                type="number" 
                value={y} 
                readOnly
                className="border border-gray-300 px-2 py-1 rounded w-16"
              />
            </div>
            
            <button 
              className="bg-blue-500 text-white py-2 px-3 rounded mt-auto"
              onClick={addSprite}
            >
              + Add Sprite
            </button>
          </div>
          
          {/* Code/Action tabs */}
          <div className="flex-1 bg-white rounded-r-md flex flex-col">
            <div className="flex border-b">
              <button 
                className={`flex-1 py-2 px-4 font-bold ${selectedTab === 'code' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setSelectedTab('code')}
              >
                📄 CODE
              </button>
              <button 
                className={`flex-1 py-2 px-4 font-bold ${selectedTab === 'action' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setSelectedTab('action')}
              >
                ▶️ ACTION
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-2">
              {selectedTab === 'code' ? (
        <BlocksPanel onAddBlock={addBlockToSprite} />
              ) : (
                <div className="space-y-2">
                  <div className="bg-green-500 text-white p-3 rounded flex items-center space-x-2">
                    <span className="font-bold">🎮 Action1</span>
                  </div>
                  <div className="bg-green-500 text-white p-3 rounded flex items-center space-x-2">
                    <span className="font-bold">🎯 Action2</span>
                  </div>
                  <div className="bg-green-600 text-white p-3 rounded flex items-center space-x-2">
                    <span className="font-bold">🐱 Actions for {activeSpriteName}</span>
                  </div>
                  
                  {/* List of active blocks for the sprite */}
                  {sprites.find(s => s.id === activeSprite)?.blocks.map((block, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                      {block.action === 'move' && `Move by ${block.params.steps} steps`}
                      {block.action === 'heroCollision' && 'On collision swap animations'}
                      {block.action === 'turn' && `Turn ${block.params.degrees} degrees`}
                      {block.action === 'say' && `Say "${block.params.message}" for ${block.params.seconds}s`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScratchEditor; 