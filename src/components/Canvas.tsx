import React, { useEffect, useRef, useState } from 'react';
import { Sprite, Block } from '../types';
import SpriteRenderer from './SpriteRenderer';

interface CanvasProps {
  sprites: Sprite[];
  setSprites: React.Dispatch<React.SetStateAction<Sprite[]>>;
  activeSprite: string;
}

const Canvas: React.FC<CanvasProps> = ({ sprites, setSprites, activeSprite }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [spriteSpeech, setSpriteSpeech] = useState<{ [key: string]: { text: string; type: 'say' | 'think'; timer: NodeJS.Timeout | null } }>({});
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Set up canvas size and add resize listener
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);
  
  // Helper function to convert sprite coordinates to screen coordinates
  const spriteToScreenCoordinates = (x: number, y: number): { screenX: number, screenY: number } => {
    if (!canvasRef.current) return { screenX: 0, screenY: 0 };
    
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    return {
      screenX: centerX + x,
      screenY: centerY - y  // Invert y-axis as screen coordinates grow downward
    };
  };
  
  // Helper function to convert screen coordinates to sprite coordinates
  const screenToSpriteCoordinates = (screenX: number, screenY: number): { x: number, y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    return {
      x: screenX - centerX,
      y: -(screenY - centerY)  // Invert y-axis as sprite coordinates grow upward
    };
  };
  
  // Handle sprite animation/execution
  useEffect(() => {
    const runningSprites = sprites.filter(s => s.isRunning);
    if (runningSprites.length === 0) return;
    
    const interval = setInterval(() => {
      setSprites(prevSprites => 
        prevSprites.map(sprite => {
          if (!sprite.isRunning) return sprite;
          
          let updatedSprite = { ...sprite };
          
          // Execute each block for the running sprite
          sprite.blocks.forEach(block => {
            switch (block.type) {
              case 'motion':
                switch (block.action) {
                  case 'move':
                    // Use the sprite's steps value or the block params
                    const steps = sprite.steps !== undefined 
                      ? sprite.steps 
                      : Number(block.params.steps);
                    
                    // Check if we're moving in a specific direction
                    if (block.params.direction === 'x') {
                      updatedSprite.x += steps;
                    } else if (block.params.direction === 'y') {
                      updatedSprite.y += steps;
                    } else if (block.params.dx !== undefined && block.params.dy !== undefined) {
                      // Move in both x and y directions
                      updatedSprite.x += Number(block.params.dx);
                      updatedSprite.y += Number(block.params.dy);
                    } else {
                      // Default behavior - move in x direction
                      updatedSprite.x += steps;
                    }
                    break;
                  case 'turn':
                    // In a real implementation, you would update the sprite's rotation
                    console.log(`Sprite ${sprite.name} turned ${block.params.degrees} degrees`);
                    break;
                  case 'goto':
                    // Move sprite to specific coordinates
                    updatedSprite.x = Number(block.params.x);
                    updatedSprite.y = Number(block.params.y);
                    break;
                  case 'random':
                    // Move to a random position within bounds
                    const randomX = Math.floor(Math.random() * canvasSize.width - canvasSize.width/2);
                    const randomY = Math.floor(Math.random() * canvasSize.height - canvasSize.height/2);
                    updatedSprite.x = randomX;
                    updatedSprite.y = randomY;
                    break;
                  default:
                    break;
                }
                break;
              
              case 'looks':
                switch (block.action) {
                  case 'say':
                    handleSpeech(sprite.id, String(block.params.message), 'say', Number(block.params.seconds));
                    break;
                  case 'think':
                    handleSpeech(sprite.id, String(block.params.message), 'think', Number(block.params.seconds));
                    break;
                  default:
                    break;
                }
                break;
              
              default:
                break;
            }
          });
          
          // Check boundaries - keep sprite within canvas
          if (canvasRef.current) {
            const maxX = canvasSize.width / 2 - 25;  // Half width minus half sprite size
            const maxY = canvasSize.height / 2 - 25; // Half height minus half sprite size
            
            // Bounce off walls
            if (updatedSprite.x < -maxX) {
              updatedSprite.x = -maxX;
              
              // Reverse steps direction
              updatedSprite.steps = updatedSprite.steps ? Math.abs(updatedSprite.steps) : 10;
              
              // Update move blocks to match new direction
              updatedSprite.blocks = updatedSprite.blocks.map(block => {
                if (block.type === 'motion' && block.action === 'move') {
                  return { 
                    ...block, 
                    params: { 
                      ...block.params, 
                      steps: Math.abs(Number(block.params.steps)) 
                    } 
                  };
                }
                return block;
              });
            }
            
            if (updatedSprite.x > maxX) {
              updatedSprite.x = maxX;
              
              // Reverse steps direction
              updatedSprite.steps = updatedSprite.steps ? -Math.abs(updatedSprite.steps) : -10;
              
              // Update move blocks to match new direction
              updatedSprite.blocks = updatedSprite.blocks.map(block => {
                if (block.type === 'motion' && block.action === 'move') {
                  return { 
                    ...block, 
                    params: { 
                      ...block.params, 
                      steps: -Math.abs(Number(block.params.steps)) 
                    } 
                  };
                }
                return block;
              });
            }
            
            if (updatedSprite.y < -maxY) {
              updatedSprite.y = -maxY;
            }
            
            if (updatedSprite.y > maxY) {
              updatedSprite.y = maxY;
            }
          }
          
          return updatedSprite;
        })
      );
    }, 100); // Update every 100ms
    
    return () => clearInterval(interval);
  }, [sprites, setSprites, canvasSize]);
  
  // Handle speech/thought bubbles
  const handleSpeech = (spriteId: string, text: string, type: 'say' | 'think', seconds: number) => {
    // Clear any existing speech for this sprite
    if (spriteSpeech[spriteId]?.timer) {
      clearTimeout(spriteSpeech[spriteId].timer);
    }
    
    // Set new speech
    setSpriteSpeech(prev => ({
      ...prev,
      [spriteId]: {
        text,
        type,
        timer: setTimeout(() => {
          setSpriteSpeech(current => {
            const updated = { ...current };
            delete updated[spriteId];
            return updated;
          });
        }, seconds * 1000)
      }
    }));
  };
  
  // Render speech bubble
  const SpeechBubble = ({ spriteId, x, y }: { spriteId: string, x: number, y: number }) => {
    const speech = spriteSpeech[spriteId];
    if (!speech) return null;
    
    const { screenX, screenY } = spriteToScreenCoordinates(x, y);
    
    return (
      <div 
        className={`absolute z-10 bg-white p-2 rounded-lg border-2 border-gray-300 max-w-[150px] text-center`}
        style={{ 
          left: `${screenX + 25}px`, 
          top: `${screenY - 60}px`,
        }}
      >
        {speech.type === 'think' ? '💭 ' : ''}
        {speech.text}
        <div 
          className="absolute w-4 h-4 bg-white border-r-2 border-b-2 border-gray-300 transform rotate-45"
          style={{ bottom: '-6px', left: '10px' }}
        />
      </div>
    );
  };
  
  // Handle dragging of sprites
  const [draggingSprite, setDraggingSprite] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent, spriteId: string) => {
    e.preventDefault();
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    setDraggingSprite(spriteId);
    setDragOffset({ x: 0, y: 0 });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingSprite || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Convert to sprite coordinates
    const spriteCoords = screenToSpriteCoordinates(mouseX, mouseY);
    
    setSprites(sprites.map(sprite => 
      sprite.id === draggingSprite
        ? { ...sprite, x: spriteCoords.x, y: spriteCoords.y }
        : sprite
    ));
  };
  
  const handleMouseUp = () => {
    setDraggingSprite(null);
  };
  
  useEffect(() => {
    // Add global mouse up event to ensure we stop dragging even if mouse is released outside canvas
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);
  
  // Get the active sprite's blocks for display
  const activeBlocks = sprites.find(s => s.id === activeSprite)?.blocks || [];
  
  return (
    <div className="flex flex-1">
      <div 
        ref={canvasRef}
        className="flex-1 bg-white relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Coordinate axes */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 opacity-50"></div>
        <div className="absolute bottom-0 top-0 left-1/2 w-0.5 bg-gray-200 opacity-50"></div>
        
        {/* Render all sprites */}
        {sprites.map(sprite => {
          const { screenX, screenY } = spriteToScreenCoordinates(sprite.x, sprite.y);
          return (
          <React.Fragment key={sprite.id}>
            <div
              className="absolute cursor-pointer"
              style={{ 
                  left: `${screenX - 25}px`, 
                  top: `${screenY - 25}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, sprite.id)}
            >
              <SpriteRenderer
                name={sprite.name}
                isActive={activeSprite === sprite.id}
                color={sprite.color}
              />
            </div>
            {/* Render speech/thought bubble for this sprite if it has one */}
            <SpeechBubble 
              spriteId={sprite.id}
              x={sprite.x}
              y={sprite.y}
            />
          </React.Fragment>
          );
        })}
      </div>
      
      {/* Show active sprite's blocks */}
      <div className="w-1/4 bg-gray-100 p-2 overflow-auto">
        <h3 className="font-bold mb-2">Blocks for {sprites.find(s => s.id === activeSprite)?.name}</h3>
        <div className="space-y-2">
          {activeBlocks.map((block, index) => (
            <div
              key={block.id}
              className={`p-2 rounded shadow ${
                block.type === 'motion' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
              }`}
            >
              <div className="font-medium">
                {block.action === 'move' && 'Move'}
                {block.action === 'turn' && 'Turn'}
                {block.action === 'goto' && 'Go to'}
                {block.action === 'say' && 'Say'}
                {block.action === 'think' && 'Think'}
                {block.action === 'repeat' && 'Repeat'}
              </div>
              <div className="text-xs opacity-80">
                {Object.entries(block.params).map(([key, value], i) => (
                  <span key={key}>
                    {key}: {value}
                    {i < Object.entries(block.params).length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {activeBlocks.length === 0 && (
            <div className="text-gray-500 italic">
              No blocks added yet. Drag blocks from the left panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas; 