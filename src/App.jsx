import React, { useState, useEffect, useRef } from 'react';
import './index.css';

function App() {
  // Directly place the sprite at center coordinates with animation data
  const [sprites, setSprites] = useState([
    { 
      id: 1, 
      name: 'Cat', 
      x: 0, 
      y: 0, 
      image: '/cat.svg', 
      width: 50, 
      height: 50,
      animation: {
        type: 'move',
        steps: 10,
        direction: 'right',
        isPlaying: false
      }
    }
  ]);
  const [selectedSpriteId, setSelectedSpriteId] = useState(1);
  const [tab, setTab] = useState('code'); // 'code' or 'action'
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  // Get the selected sprite
  const selectedSprite = sprites.find(sprite => sprite.id === selectedSpriteId) || sprites[0];
  
  // Add a new sprite
  const handleAddSprite = () => {
    const newId = Math.max(0, ...sprites.map(s => s.id)) + 1;
    setSprites([...sprites, {
      id: newId,
      name: `Sprite${newId}`,
      x: 0, // Start at center (0,0)
      y: 0,
      width: 50,
      height: 50,
      image: '/baseball.svg',
      animation: {
        type: 'move',
        steps: -10, // Opposite direction from first sprite
        direction: 'left',
        isPlaying: false
      }
    }]);
    setSelectedSpriteId(newId);
  };

  // Directly calculate pixel position from sprite coordinates
  const getPixelPosition = (sprite) => {
    if (!canvasRef.current) return { left: '50%', top: '50%' };
    
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;
    
    // Calculate center point of canvas
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Convert sprite coordinates to pixel position from the center
    const left = centerX + sprite.x - (sprite.width / 2);
    const top = centerY - sprite.y - (sprite.height / 2);
    
    return {
      left: `${left}px`,
      top: `${top}px`
    };
  };

  // Update sprite position
  const updateSpritePosition = (id, x, y) => {
    // Check canvas boundaries
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      const maxX = canvasSize.width / 2 - 25;  // Half the sprite width
      const maxY = canvasSize.height / 2 - 25; // Half the sprite height
      
      x = Math.max(-maxX, Math.min(maxX, x));
      y = Math.max(-maxY, Math.min(maxY, y));
    }
    
    setSprites(sprites.map(sprite => 
      sprite.id === id ? { ...sprite, x, y } : sprite
    ));
  };

  // Movement functions
  const moveLeft = () => {
    updateSpritePosition(selectedSpriteId, selectedSprite.x - 10, selectedSprite.y);
    checkCollisions(selectedSpriteId, selectedSprite.x - 10, selectedSprite.y);
  };

  const moveRight = () => {
    updateSpritePosition(selectedSpriteId, selectedSprite.x + 10, selectedSprite.y);
    checkCollisions(selectedSpriteId, selectedSprite.x + 10, selectedSprite.y);
  };

  const moveUp = () => {
    updateSpritePosition(selectedSpriteId, selectedSprite.x, selectedSprite.y + 10);
    checkCollisions(selectedSpriteId, selectedSprite.x, selectedSprite.y + 10);
  };

  const moveDown = () => {
    updateSpritePosition(selectedSpriteId, selectedSprite.x, selectedSprite.y - 10);
    checkCollisions(selectedSpriteId, selectedSprite.x, selectedSprite.y - 10);
  };

  // Check collisions between sprites - HERO FEATURE
  const checkCollisions = (id, newX, newY) => {
    const movedSprite = sprites.find(s => s.id === id);
    if (!movedSprite) return;
    
    const COLLISION_THRESHOLD = 50; // Distance threshold for collision
    
    sprites.forEach(otherSprite => {
      if (otherSprite.id !== id) {
        const distance = Math.sqrt(
          Math.pow(newX - otherSprite.x, 2) + 
          Math.pow(newY - otherSprite.y, 2)
        );
        
        // If collision detected, swap the positions AND animations (hero feature)
        if (distance < COLLISION_THRESHOLD) {
          setSprites(sprites.map(s => {
            if (s.id === id) {
              return { 
                ...s, 
                x: otherSprite.x, 
                y: otherSprite.y,
                animation: {
                  ...s.animation,
                  steps: otherSprite.animation.steps,
                  direction: otherSprite.animation.direction
                }
              };
            } else if (s.id === otherSprite.id) {
              return { 
                ...s, 
                x: newX, 
                y: newY,
                animation: {
                  ...s.animation,
                  steps: movedSprite.animation.steps,
                  direction: movedSprite.animation.direction
                }
              };
            }
            return s;
          }));
          
          // Display collision notification
          showCollisionNotification();
        }
      }
    });
  };

  // Show collision notification
  const showCollisionNotification = () => {
    // Add a notification div that fades out
    const notification = document.createElement('div');
    notification.textContent = 'Hero Feature: Animations Swapped!';
    notification.style.position = 'absolute';
    notification.style.top = '10px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '100';
    notification.style.transition = 'opacity 1s';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 1000);
    }, 2000);
  };

  // Run animations for all sprites
  const runAnimations = () => {
    if (isAnimating) {
      // Move each sprite according to its animation
      setSprites(prev => prev.map(sprite => {
        if (sprite.animation.isPlaying) {
          let newX = sprite.x;
          let newY = sprite.y;
          
          // Apply movement based on direction
          switch (sprite.animation.direction) {
            case 'right':
              newX += sprite.animation.steps > 0 ? 5 : -5;
              break;
            case 'left':
              newX -= sprite.animation.steps > 0 ? 5 : -5;
              break;
            case 'up':
              newY += sprite.animation.steps > 0 ? 5 : -5;
              break;
            case 'down':
              newY -= sprite.animation.steps > 0 ? 5 : -5;
              break;
            default:
              break;
          }
          
          // Check for collisions
          checkCollisions(sprite.id, newX, newY);
          
          return {
            ...sprite,
            x: newX,
            y: newY
          };
        }
        return sprite;
      }));

      // Continue animation loop
      animationRef.current = requestAnimationFrame(runAnimations);
    }
  };

  // Toggle play/stop animations
  const toggleAnimations = () => {
    if (!isAnimating) {
      // Start animations
      setIsAnimating(true);
      setSprites(prev => prev.map(sprite => ({
        ...sprite,
        animation: {
          ...sprite.animation,
          isPlaying: true
        }
      })));
    } else {
      // Stop animations
      setIsAnimating(false);
      setSprites(prev => prev.map(sprite => ({
        ...sprite,
        animation: {
          ...sprite.animation,
          isPlaying: false
        }
      })));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  // Animation effect
  useEffect(() => {
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(runAnimations);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, sprites]);

  // Measure canvas size for boundaries
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Center sprites initially when canvas size is known
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      // Force sprites to be at center when canvas size is first measured
      setSprites(sprites.map(sprite => ({
        ...sprite,
        x: 0,
        y: 0
      })));
    }
  }, [canvasSize.width, canvasSize.height]);

  // Handle keyboard movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          moveLeft();
          break;
        case 'ArrowRight':
          moveRight();
          break;
        case 'ArrowUp':
          moveUp();
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case ' ': // Spacebar
          toggleAnimations();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSpriteId, sprites, isAnimating]); // Re-add event listener when relevant state changes

  // Set animation direction
  const setAnimationDirection = (direction) => {
    setSprites(prev => prev.map(sprite => 
      sprite.id === selectedSpriteId 
        ? { 
            ...sprite, 
            animation: { 
              ...sprite.animation, 
              direction 
            } 
          } 
        : sprite
    ));
  };

  // Set animation steps
  const setAnimationSteps = (steps) => {
    setSprites(prev => prev.map(sprite => 
      sprite.id === selectedSpriteId 
        ? { 
            ...sprite, 
            animation: { 
              ...sprite.animation, 
              steps 
            } 
          } 
        : sprite
    ));
  };

  return (
    <div className="scratch-app">
      <header className="header">
        <h1>ScrAtch</h1>
        <div className="tabs">
          <button 
            className={`tab ${tab === 'code' ? 'active' : ''}`} 
            onClick={() => setTab('code')}>CODE</button>
          <button 
            className={`tab ${tab === 'action' ? 'active' : ''}`} 
            onClick={() => setTab('action')}>ACTION</button>
        </div>
      </header>
      
      <div className="canvas-container" ref={canvasRef}>
        {/* Cross lines to mark center */}
        <div style={{
          position: 'absolute',
          left: '0',
          right: '0',
          top: '50%',
          height: '1px',
          backgroundColor: '#ccc'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '0',
          bottom: '0',
          left: '50%',
          width: '1px',
          backgroundColor: '#ccc'
        }}></div>
        
        {/* Origin label */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(5px, 5px)',
          fontSize: '10px',
          color: '#999'
        }}>
          (0,0)
        </div>
        
        {/* Render all sprites with absolute positioning */}
        {sprites.map(sprite => {
          const position = getPixelPosition(sprite);
          return (
            <div 
              key={sprite.id}
              style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                width: `${sprite.width}px`,
                height: `${sprite.height}px`,
                cursor: 'pointer',
                border: selectedSpriteId === sprite.id ? '2px solid blue' : 'none',
                zIndex: selectedSpriteId === sprite.id ? 20 : 10,
              }}
              onClick={() => setSelectedSpriteId(sprite.id)}
            >
              <img 
                className="sprite-image"
                src={sprite.image}
                alt={sprite.name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><rect width='50' height='50' fill='orange'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='16'>${sprite.name}</text></svg>`;
                }}
              />
            </div>
          );
        })}
      </div>
      
      <div className="coordinate-display">
        <div className="coordinate">
          <span>Sprite:</span>{selectedSprite.name}
        </div>
        <div className="coordinate">
          <span>X:</span>{selectedSprite.x}
        </div>
        <div className="coordinate">
          <span>Y:</span>{selectedSprite.y}
        </div>
        <div className="coordinate">
          <span>Animation:</span>
          {selectedSprite.animation.direction} ({selectedSprite.animation.steps} steps)
        </div>
      </div>

      {tab === 'code' && (
        <div className="blocks-panel">
          <div className="panel-section">
            <h3>Motion</h3>
            <div className="motion-blocks">
              <button className="block motion-block" onClick={moveLeft}>Move Left</button>
              <button className="block motion-block" onClick={moveRight}>Move Right</button>
              <button className="block motion-block" onClick={moveUp}>Move Up</button>
              <button className="block motion-block" onClick={moveDown}>Move Down</button>
            </div>
          </div>
          
          <div className="panel-section">
            <h3>Animation</h3>
            <div className="animation-blocks">
              <div className="animation-row">
                <button className="block animation-block" onClick={() => setAnimationDirection('right')}>Move Right</button>
                <button className="block animation-block" onClick={() => setAnimationDirection('left')}>Move Left</button>
              </div>
              <div className="animation-row">
                <button className="block animation-block" onClick={() => setAnimationDirection('up')}>Move Up</button>
                <button className="block animation-block" onClick={() => setAnimationDirection('down')}>Move Down</button>
              </div>
              <div className="animation-row">
                <button className="block animation-block" onClick={() => setAnimationSteps(10)}>+10 Steps</button>
                <button className="block animation-block" onClick={() => setAnimationSteps(-10)}>-10 Steps</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'action' && (
        <div className="action-panel">
          <button className="action-button" onClick={handleAddSprite}>+ Add Sprite</button>
          <button 
            className={`action-button ${isAnimating ? 'stop' : 'play'}`} 
            onClick={toggleAnimations}
          >
            {isAnimating ? 'Stop' : 'Play'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App; 