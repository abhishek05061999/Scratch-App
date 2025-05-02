import React, { useState, useRef, useEffect } from 'react';

// Constants
const REPEAT_COUNT = 5; // Number of times to repeat actions

function App() {
  const [sprites, setSprites] = useState([
    { id: 1, type: 'Cat', x: 0, y: 0, actions: [], actions2: [], size: 1, rotation: 0 }
  ]);
  const [activeSpriteId, setActiveSpriteId] = useState(1);
  const [showCodeScreen, setShowCodeScreen] = useState(false);
  const [actions, setActions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState({ text: '', timer: null });
  const [activeActionTab, setActiveActionTab] = useState(1); // 1 for Action1, 2 for Action2
  const canvasRef = useRef(null);
  
  // Use refs for animation state to avoid dependency issues
  const isPlayingRef = useRef(false);
  const activeTimeoutsRef = useRef([]);
  const collisionOccurredRef = useRef(false);
  
  const activeSprite = sprites.find(sprite => sprite.id === activeSpriteId) || sprites[0];

  // Set isPlayingRef whenever isPlaying changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Clear all active timeouts
  const clearAllTimeouts = () => {
    activeTimeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    activeTimeoutsRef.current = [];
  };

  // Clear any running animations on unmount
  useEffect(() => {
    return () => {
      if (message.timer) {
        clearTimeout(message.timer);
      }
      clearAllTimeouts();
    };
  }, [message.timer]);

  // Process actions and expand repeats for a sprite
  const expandActionsForSprite = (sprite) => {
    const actions1 = sprite.actions || [];
    const actions2 = sprite.actions2 || [];
    let expandedActions = [];
    
    // Process first action list
    let repeatIndex1 = actions1.indexOf('repeat');
    if (repeatIndex1 > 0) {
      // Get actions before repeat
      const actionsToRepeat = actions1.slice(0, repeatIndex1);
      // Add them multiple times
      for (let i = 0; i < REPEAT_COUNT; i++) {
        expandedActions = [...expandedActions, ...actionsToRepeat];
      }
    } else {
      // No repeat, just add the actions
      expandedActions = [...expandedActions, ...actions1];
    }
    
    // Process second action list
    let repeatIndex2 = actions2.indexOf('repeat');
    if (repeatIndex2 > 0) {
      // Get actions before repeat
      const actionsToRepeat = actions2.slice(0, repeatIndex2);
      // Add them multiple times
      for (let i = 0; i < REPEAT_COUNT; i++) {
        expandedActions = [...expandedActions, ...actionsToRepeat];
      }
    } else {
      // No repeat, just add the actions
      expandedActions = [...expandedActions, ...actions2];
    }
    
    // Filter out any repeat tokens that might have been added
    expandedActions = expandedActions.filter(action => action !== 'repeat');
    
    return expandedActions;
  };

  // Handle sprite dragging
  const handleMouseDown = (e, spriteId) => {
    if (isPlaying) return; // Prevent dragging while animations are playing
    
    // Set this sprite as active
    setActiveSpriteId(spriteId);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const handleMouseMove = (e) => {
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      // Convert screen coordinates to sprite coordinates (center is 0,0)
      const x = Math.round(rawX - centerX);
      const y = Math.round(centerY - rawY); // Invert Y-axis
      
      setSprites(prevSprites => 
        prevSprites.map(sprite => 
          sprite.id === spriteId 
            ? { ...sprite, x, y }
            : sprite
        )
      );
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle touch events for mobile
  const handleTouchStart = (e, spriteId) => {
    if (isPlaying) return; // Prevent dragging while animations are playing
    
    // Set this sprite as active
    setActiveSpriteId(spriteId);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rawX = touch.clientX - rect.left;
      const rawY = touch.clientY - rect.top;
      
      // Convert screen coordinates to sprite coordinates (center is 0,0)
      const x = Math.round(rawX - centerX);
      const y = Math.round(centerY - rawY); // Invert Y-axis
      
      setSprites(prevSprites => 
        prevSprites.map(sprite => 
          sprite.id === spriteId 
            ? { ...sprite, x, y }
            : sprite
        )
      );
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove, { passive: false });
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleAddSprite = () => {
    // Only allow adding a sprite if we have fewer than 2
    if (sprites.length >= 2) {
      return;
    }
    
    const newSpriteId = sprites.length > 0 ? Math.max(...sprites.map(s => s.id)) + 1 : 1;
    // If we have 1 sprite and it's a Cat, add a Ball, otherwise add a Cat
    const newSpriteType = sprites.length === 1 && sprites[0].type === 'Cat' ? 'Ball' : 'Cat';
    
    const newSprite = { 
      id: newSpriteId, 
      type: newSpriteType, 
      x: 0, 
      y: 0, 
      actions: [],
      actions2: [],
      size: 1,
      rotation: 0
    };
    
    // Add the new sprite while preserving the existing sprites and their actions
    setSprites(prevSprites => [...prevSprites, newSprite]);
    
    // Switch to the new sprite
    setActiveSpriteId(newSpriteId);
  };

  const handleReset = () => {
    // Clear all running timeouts and animations
    clearAllTimeouts();
    if (message.timer) {
      clearTimeout(message.timer);
    }
    
    // Set playing to false
    setIsPlaying(false);
    isPlayingRef.current = false;
    
    // Reset message
    setMessage({ text: '', timer: null });
    
    // Reset collision flag
    collisionOccurredRef.current = false;
    
    // Reset to initial state with only the original cat sprite and no actions
    setSprites([{ 
      id: 1, 
      type: 'Cat', 
      x: 0, 
      y: 0, 
      actions: [], 
      actions2: [], 
      size: 1,
      rotation: 0
    }]);
    
    // Set active sprite back to the cat
    setActiveSpriteId(1);
  };

  const handleAddActions = () => {
    // First make sure we select the right sprite
    if (!activeSprite) return;
    
    setShowCodeScreen(true);
    
    // Load the actions based on the active tab
    if (activeActionTab === 1) {
      setActions([...activeSprite.actions] || []);
    } else {
      setActions([...activeSprite.actions2] || []);
    }
  };

  const handleDone = () => {
    setShowCodeScreen(false);
    
    // Save actions to the appropriate array based on the active tab
    setSprites(prevSprites => 
      prevSprites.map(sprite => 
        sprite.id === activeSpriteId 
          ? (activeActionTab === 1 
              ? { ...sprite, actions: [...actions] }
              : { ...sprite, actions2: [...actions] })
          : sprite
      )
    );
  };

  const handleActionSelect = (action) => {
    setActions([...actions, action]);
  };

  const handleClearAllActions = () => {
    // Clear all actions in the current tab
    setActions([]);
  };

  const handleDeleteSpriteAction = (actionIndex) => {
    // Delete individual action from the sprite's actions
    const updatedActions = [...actions];
    updatedActions.splice(actionIndex, 1);
    setActions(updatedActions);
  };

  // Start animations for all sprites (extracted from handlePlay for reuse)
  const startAnimations = (delayOffset = 0) => {
    // Reset collision flag
    collisionOccurredRef.current = false;
    
    // For each sprite, execute its actions
    sprites.forEach(sprite => {
      // Expand the actions for this sprite
      const expandedActions = expandActionsForSprite(sprite);
      
      if (expandedActions.length === 0) {
        return; // Skip if no actions
      }
      
      console.log(`Sprite ${sprite.id} has ${expandedActions.length} expanded actions:`, expandedActions);
      
      // Start executing actions from the beginning for this sprite
      let actionIndex = 0;
      
      const executeNextAction = () => {
        // Stop if we're done or no longer playing
        if (!isPlayingRef.current || actionIndex >= expandedActions.length) {
          return;
        }
        
        // Get the current action and increment index
        const currentAction = expandedActions[actionIndex++];
        
        // Make sure we still have a valid sprite
        const currentSprite = sprites.find(s => s.id === sprite.id);
        if (!currentSprite) {
          return;
        }
        
        console.log(`Sprite ${sprite.id} executing action:`, currentAction, `(${actionIndex}/${expandedActions.length})`);
        
        // Execute the action with callback to next action
        executeAction(currentSprite, currentAction, executeNextAction);
      };
      
      // Use a consistent start delay for all sprites to ensure uniform animation
      const startTimeout = setTimeout(executeNextAction, delayOffset + 50);
      activeTimeoutsRef.current.push(startTimeout);
    });
    
    // Set a timeout to check if all sprites have finished their actions
    const checkFinishedTimeout = setInterval(() => {
      if (!isPlayingRef.current) {
        clearInterval(checkFinishedTimeout);
        return;
      }
      
      // Check if any active timeouts remain besides this interval
      if (activeTimeoutsRef.current.length <= 1) {
        // All animations have finished
        setIsPlaying(false);
        isPlayingRef.current = false;
        
        // Reset collision flag when animations complete
        collisionOccurredRef.current = false;
        
        clearInterval(checkFinishedTimeout);
      }
    }, 500);
    activeTimeoutsRef.current.push(checkFinishedTimeout);
  };

  // Check for collisions among all sprites
  const checkAllCollisions = () => {
    if (!isPlayingRef.current) return false;
    
    // Skip if collision already occurred
    if (collisionOccurredRef.current) {
      return false;
    }
    
    // Check each pair of sprites for collisions
    for (let i = 0; i < sprites.length; i++) {
      for (let j = i + 1; j < sprites.length; j++) {
        const sprite1 = sprites[i];
        const sprite2 = sprites[j];
        
        // Calculate distance between sprites
        const distance = Math.sqrt(
          Math.pow(sprite1.x - sprite2.x, 2) + 
          Math.pow(sprite1.y - sprite2.y, 2)
        );
        
        const COLLISION_THRESHOLD = 50; // Adjust based on sprite size
        
        // If collision detected, immediately swap actions
        if (distance < COLLISION_THRESHOLD) {
          console.log(`Collision detected between Sprite ${sprite1.id} and Sprite ${sprite2.id}!`);
          
          // Mark that a collision occurred
          collisionOccurredRef.current = true;
          
          // Clear all running timeouts to stop animations
          clearAllTimeouts();
          
          // Store actions to swap
          const sprite1Actions = [...sprite1.actions];
          const sprite1Actions2 = [...sprite1.actions2];
          const sprite2Actions = [...sprite2.actions];
          const sprite2Actions2 = [...sprite2.actions2];
          
          // Update sprites with swapped actions
          setSprites(prev => {
            return prev.map(s => {
              if (s.id === sprite1.id) {
                return {
                  ...s,
                  actions: sprite2Actions,
                  actions2: sprite2Actions2
                };
              }
              if (s.id === sprite2.id) {
                return {
                  ...s,
                  actions: sprite1Actions,
                  actions2: sprite1Actions2
                };
              }
              return s;
            });
          });
          
          // Force immediate restart of animations
          setTimeout(() => {
            // Reset collision flag
            collisionOccurredRef.current = false;
            
            // Force a restart of all animations with swapped actions
            if (isPlayingRef.current) {
              const updatedSprites = sprites.map(s => {
                if (s.id === sprite1.id) {
                  return {
                    ...s,
                    actions: sprite2Actions,
                    actions2: sprite2Actions2
                  };
                }
                if (s.id === sprite2.id) {
                  return {
                    ...s,
                    actions: sprite1Actions,
                    actions2: sprite1Actions2
                  };
                }
                return s;
              });
              
              // Run animations with swapped actions
              updatedSprites.forEach(sprite => {
                const expandedActions = expandActionsForSprite(sprite);
                
                if (expandedActions.length === 0) {
                  return; // Skip if no actions
                }
                
                // Start executing actions from the beginning for this sprite
                let actionIndex = 0;
                
                const executeNextAction = () => {
                  // Stop if we're done or no longer playing
                  if (!isPlayingRef.current || actionIndex >= expandedActions.length) {
                    return;
                  }
                  
                  // Get the current action and increment index
                  const currentAction = expandedActions[actionIndex++];
                  
                  // Execute the action with callback to next action
                  executeAction(sprite, currentAction, executeNextAction);
                };
                
                // Start with minimal delay
                const startTimeout = setTimeout(executeNextAction, 50);
                activeTimeoutsRef.current.push(startTimeout);
              });
            }
          }, 100);
          
          return true;
        }
      }
    }
    
    return false;
  };

  // Execute a single action
  const executeAction = (sprite, action, callback) => {
    // Stop if we're no longer playing
    if (!isPlayingRef.current) {
      return;
    }
    
    console.log('Executing action:', action, 'for sprite:', sprite.id);
    
    // Fixed durations for all animations to ensure consistent timing
    const MOVE_DURATION = 500; // Duration for movement actions (ms)
    const ROTATION_DURATION = 1000; // Duration for rotation (ms)
    const SIZE_CHANGE_DURATION = 500; // Duration for size changes (ms)
    const SAY_DURATION = 1000; // Duration for speech bubbles (ms)
    
    switch(action) {
      case 'moveX':
        // Move 50 pixels in X direction
        const newX = sprite.x + 50;
        setSprites(prevSprites => {
          return prevSprites.map(s => 
            s.id === sprite.id ? { ...s, x: newX } : s
          );
        });
        
        // Check for collisions after state update
        setTimeout(() => {
          if (isPlayingRef.current) {
            // Check for collisions if not already occurred
            if (!collisionOccurredRef.current) {
              checkAllCollisions();
            }
            
            // Continue to next action
            if (isPlayingRef.current && callback) {
              callback();
            }
          }
        }, MOVE_DURATION);
        break;
        
      case 'moveXMinus10':
        // Move -10 pixels in X direction
        const newXMinus = sprite.x - 10;
        setSprites(prevSprites => {
          return prevSprites.map(s => 
            s.id === sprite.id ? { ...s, x: newXMinus } : s
          );
        });
        
        // Check for collisions after state update
        setTimeout(() => {
          if (isPlayingRef.current) {
            // Check for collisions if not already occurred
            if (!collisionOccurredRef.current) {
              checkAllCollisions();
            }
            
            // Continue to next action
            if (isPlayingRef.current && callback) {
              callback();
            }
          }
        }, MOVE_DURATION);
        break;
        
      case 'moveXPlus10':
        // Move +10 pixels in X direction
        const newXPlus = sprite.x + 10;
        setSprites(prevSprites => {
          return prevSprites.map(s => 
            s.id === sprite.id ? { ...s, x: newXPlus } : s
          );
        });
        
        // Check for collisions after state update
        setTimeout(() => {
          if (isPlayingRef.current) {
            // Check for collisions if not already occurred
            if (!collisionOccurredRef.current) {
              checkAllCollisions();
            }
            
            // Continue to next action
            if (isPlayingRef.current && callback) {
              callback();
            }
          }
        }, MOVE_DURATION);
        break;
        
      case 'moveY':
        // Move 50 pixels in Y direction
        const newY = sprite.y + 50;
        setSprites(prevSprites => {
          return prevSprites.map(s => 
            s.id === sprite.id ? { ...s, y: newY } : s
          );
        });
        
        // Check for collisions after state update
        setTimeout(() => {
          if (isPlayingRef.current) {
            // Check for collisions if not already occurred
            if (!collisionOccurredRef.current) {
              checkAllCollisions();
            }
            
            // Continue to next action
            if (isPlayingRef.current && callback) {
              callback();
            }
          }
        }, MOVE_DURATION);
        break;
        
      case 'goTo00':
        // Move to position 0,0
        setSprites(prevSprites => {
          return prevSprites.map(s => 
            s.id === sprite.id ? { ...s, x: 0, y: 0 } : s
          );
        });
        
        // Check for collisions after state update
        setTimeout(() => {
          if (isPlayingRef.current) {
            // Check for collisions if not already occurred
            if (!collisionOccurredRef.current) {
              checkAllCollisions();
            }
            
            // Continue to next action
            if (isPlayingRef.current && callback) {
              callback();
            }
          }
        }, MOVE_DURATION);
        break;
        
      case 'moveXY':
        // Move 50 pixels in both X and Y
        const newXY = { x: sprite.x + 50, y: sprite.y + 50 };
        setSprites(prevSprites => {
          return prevSprites.map(s => 
            s.id === sprite.id ? { ...s, ...newXY } : s
          );
        });
        
        // Check for collisions after state update
        setTimeout(() => {
          if (isPlayingRef.current) {
            // Check for collisions if not already occurred
            if (!collisionOccurredRef.current) {
              checkAllCollisions();
            }
            
            // Continue to next action
            if (isPlayingRef.current && callback) {
              callback();
            }
          }
        }, MOVE_DURATION);
        break;
        
      case 'goRandom':
        // Move to random position
        if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const randomX = Math.floor(Math.random() * (rect.width - 50));
          const randomY = Math.floor(Math.random() * (rect.height - 50));
          
          setSprites(prevSprites => {
            return prevSprites.map(s => 
              s.id === sprite.id ? { ...s, x: randomX, y: randomY } : s
            );
          });
        }
        
        // Check for collisions after state update
        setTimeout(() => {
          if (isPlayingRef.current) {
            // Check for collisions if not already occurred
            if (!collisionOccurredRef.current) {
              checkAllCollisions();
            }
            
            // Continue to next action
            if (isPlayingRef.current && callback) {
              callback();
            }
          }
        }, MOVE_DURATION);
        break;
      
      // Other cases (non-movement)
      default:
        // For other actions like say hello, rotate, change size
        if (action === 'sayHello' || action === 'sayHello1Sec') {
          // Display speech bubble
          setMessage({ 
            text: 'Hello!', 
            spriteId: sprite.id,
            timer: null
          });
          
          const timer = setTimeout(() => {
            if (isPlayingRef.current) {
              setMessage({ text: '', timer: null });
              if (callback) callback();
            }
          }, SAY_DURATION);
          activeTimeoutsRef.current.push(timer);
          setMessage(prev => ({ ...prev, timer }));
          
        } else if (action === 'rotate') {
          // Rotate the sprite
          setSprites(prevSprites => {
            const updatedSprite = prevSprites.find(s => s.id === sprite.id);
            if (!updatedSprite) return prevSprites;
            
            const currentRotation = updatedSprite.rotation || 0;
            return prevSprites.map(s => 
              s.id === sprite.id ? { 
                ...s, 
                rotation: currentRotation + 360  // Full 360-degree rotation
              } : s
            );
          });
          
          const rotateTimeout = setTimeout(() => {
            if (isPlayingRef.current && callback) callback();
          }, ROTATION_DURATION);
          activeTimeoutsRef.current.push(rotateTimeout);
          
        } else if (action === 'increaseSize') {
          // Increase sprite size
          setSprites(prevSprites => {
            const updatedSprite = prevSprites.find(s => s.id === sprite.id);
            if (!updatedSprite) return prevSprites;
            
            return prevSprites.map(s => 
              s.id === sprite.id ? { ...s, size: s.size * 1.2 } : s
            );
          });
          
          const increaseSizeTimeout = setTimeout(() => {
            if (isPlayingRef.current && callback) callback();
          }, SIZE_CHANGE_DURATION);
          activeTimeoutsRef.current.push(increaseSizeTimeout);
          
        } else if (action === 'decreaseSize') {
          // Decrease sprite size
          setSprites(prevSprites => {
            const updatedSprite = prevSprites.find(s => s.id === sprite.id);
            if (!updatedSprite) return prevSprites;
            
            return prevSprites.map(s => 
              s.id === sprite.id ? { ...s, size: Math.max(0.5, s.size * 0.8) } : s
            );
          });
          
          const decreaseSizeTimeout = setTimeout(() => {
            if (isPlayingRef.current && callback) callback();
          }, SIZE_CHANGE_DURATION);
          activeTimeoutsRef.current.push(decreaseSizeTimeout);
          
        } else {
          // Unknown action, just proceed
          if (callback) setTimeout(() => callback(), 100);
        }
        break;
    }
  };

  // Handle play button click
  const handlePlay = () => {
    // If already playing, stop first
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      clearAllTimeouts();
      return;
    }
    
    // Clear any existing timeouts before starting
    clearAllTimeouts();
    
    // Reset collision flag
    collisionOccurredRef.current = false;
    
    // Set playing state
    setIsPlaying(true);
    isPlayingRef.current = true;
    
    // Start animations directly
    sprites.forEach(sprite => {
      // Expand the actions for this sprite
      const expandedActions = expandActionsForSprite(sprite);
      
      if (expandedActions.length === 0) {
        return; // Skip if no actions
      }
      
      console.log(`Sprite ${sprite.id} has ${expandedActions.length} expanded actions:`, expandedActions);
      
      // Start executing actions from the beginning for this sprite
      let actionIndex = 0;
      
      const executeNextAction = () => {
        // Stop if we're done or no longer playing
        if (!isPlayingRef.current || actionIndex >= expandedActions.length) {
          return;
        }
        
        // Get the current action and increment index
        const currentAction = expandedActions[actionIndex++];
        
        // Make sure we still have a valid sprite
        const currentSprite = sprites.find(s => s.id === sprite.id);
        if (!currentSprite) {
          return;
        }
        
        console.log(`Sprite ${sprite.id} executing action:`, currentAction, `(${actionIndex}/${expandedActions.length})`);
        
        // Execute the action with callback to next action
        executeAction(currentSprite, currentAction, executeNextAction);
      };
      
      // Start with delay to ensure state is settled
      const startTimeout = setTimeout(executeNextAction, 50);
      activeTimeoutsRef.current.push(startTimeout);
    });
    
    // Set a timeout to check if all sprites have finished their actions
    const checkFinishedTimeout = setInterval(() => {
      if (!isPlayingRef.current) {
        clearInterval(checkFinishedTimeout);
        return;
      }
      
      // Check if any active timeouts remain besides this interval
      if (activeTimeoutsRef.current.length <= 1) {
        // All animations have finished
        setIsPlaying(false);
        isPlayingRef.current = false;
        
        // Reset collision flag when animations complete
        collisionOccurredRef.current = false;
        
        clearInterval(checkFinishedTimeout);
      }
    }, 500);
    activeTimeoutsRef.current.push(checkFinishedTimeout);
  };

  // Add event listener for page unload to clear timeouts
  useEffect(() => {
    const handleUnload = () => {
      clearAllTimeouts();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Main render - for code screen
  if (showCodeScreen) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <div style={{ 
          backgroundColor: '#4a90e2', 
          padding: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setShowCodeScreen(false)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white',
              fontSize: '16px'
            }}
          >
            ← Back
          </button>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>ScrAtch</div>
          <button 
            onClick={handleDone} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white',
              fontSize: '16px'
            }}
          >
            Done
          </button>
        </div>
        
        {/* Code screen content */}
        <div style={{ display: 'flex' }}>
          {/* Left side - code blocks */}
          <div style={{ 
            flex: 1, 
            borderRight: '1px solid #ddd', 
            padding: '10px'
          }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '5px', 
              backgroundColor: '#f0f0f0',
              marginBottom: '10px'
            }}>
              <span style={{ color: '#4a90e2' }}>📋 CODE</span>
            </div>
            
            {/* Code blocks */}
            <div>
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('moveX')}
              >
                Move X by 50
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('moveXMinus10')}
              >
                Move X by -10
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('moveXPlus10')}
              >
                Move X by +10
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('moveY')}
              >
                Move Y by 50
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('rotate')}
              >
                Rotate 360
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('goTo00')}
              >
                go to (0,0)
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('moveXY')}
              >
                Move X+50,Y+50
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('goRandom')}
              >
                go to random position
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('sayHello')}
              >
                Say Hello
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('sayHello1Sec')}
              >
                Say Hello For 1 sec
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('increaseSize')}
              >
                Increase Size
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('decreaseSize')}
              >
                Dec Size
              </div>
              
              <div 
                style={{ 
                  backgroundColor: '#85c0ff', 
                  padding: '10px', 
                  marginBottom: '5px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleActionSelect('repeat')}
              >
                Repeat x{REPEAT_COUNT}
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, padding: '10px' }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '5px', 
              backgroundColor: '#f0f0f0',
              marginBottom: '10px'
            }}>
              <span style={{ color: '#4caf50' }}>🚩 ACTION</span>
            </div>
            
            {/* Action tabs */}
            <div style={{ 
              display: 'flex', 
              marginBottom: '10px' 
            }}>
              <div 
                style={{ 
                  flex: 1,
                  padding: '8px',
                  textAlign: 'center',
                  backgroundColor: activeActionTab === 1 ? '#4caf50' : '#f0f0f0',
                  color: activeActionTab === 1 ? 'white' : 'black',
                  cursor: 'pointer',
                  borderTopLeftRadius: '4px',
                  borderBottomLeftRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setActiveActionTab(1)}
              >
                <img 
                  src={activeSprite.type === 'Cat' 
                    ? "https://en.scratch-wiki.info/w/images/ScratchCat-Small.png" 
                    : "/baseball.svg"}
                  alt={`${activeSprite.type} Action1`}
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '5px'
                  }}
                />
                Action1
              </div>
              <div 
                style={{ 
                  flex: 1,
                  padding: '8px',
                  textAlign: 'center',
                  backgroundColor: activeActionTab === 2 ? '#4caf50' : '#f0f0f0',
                  color: activeActionTab === 2 ? 'white' : 'black',
                  cursor: 'pointer',
                  borderTopRightRadius: '4px',
                  borderBottomRightRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setActiveActionTab(2)}
              >
                <img 
                  src={activeSprite.type === 'Cat' 
                    ? "https://en.scratch-wiki.info/w/images/ScratchCat-Small.png" 
                    : "/baseball.svg"}
                  alt={`${activeSprite.type} Action2`}
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '5px'
                  }}
                />
                Action2
              </div>
            </div>
            
            {/* Action slots */}
            <div>
              <div style={{ 
                textAlign: 'center', 
                padding: '10px', 
                backgroundColor: '#4caf50',
                color: 'white',
                marginBottom: '10px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeSprite.type === 'Cat' ? (
                  <img 
                    src="https://en.scratch-wiki.info/w/images/ScratchCat-Small.png" 
                    alt="Cat"
                    style={{ 
                      width: '24px', 
                      height: '24px',
                      marginRight: '10px'
                    }}
                  />
                ) : (
                  <img 
                    src="/baseball.svg" 
                    alt="Ball"
                    style={{ 
                      width: '24px', 
                      height: '24px',
                      marginRight: '10px'
                    }}
                  />
                )}
                Actions for {activeSprite.type}
              </div>
              
              {/* Add button to copy actions from other sprite */}
              {sprites.length > 1 && (
                <div 
                  style={{
                    textAlign: 'center',
                    padding: '5px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                  onClick={() => {
                    // Find the other sprite
                    const otherSprite = sprites.find(s => s.id !== activeSpriteId);
                    if (!otherSprite) return;
                    
                    // Copy actions from the other sprite
                    if (activeActionTab === 1) {
                      setActions([...otherSprite.actions]);
                    } else {
                      setActions([...otherSprite.actions2]);
                    }
                  }}
                >
                  Copy From {activeSprite.type === 'Cat' ? 'Ball' : 'Cat'}
                </div>
              )}
              
              {/* Clear All button */}
              {actions.length > 0 && (
                <div 
                  style={{
                    textAlign: 'center',
                    padding: '5px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    backgroundColor: '#f44336',
                    color: 'white',
                    borderRadius: '4px'
                  }}
                  onClick={handleClearAllActions}
                >
                  Clear All Actions
                </div>
              )}
              
              {/* Selected actions */}
              <div>
                {actions.map((action, index) => {
                  let actionDisplay = action;
                  
                  // Show human-readable action name
                  switch(action) {
                    case 'moveX': actionDisplay = 'Move X by 50'; break;
                    case 'moveY': actionDisplay = 'Move Y by 50'; break;
                    case 'rotate': actionDisplay = 'Rotate 360'; break;
                    case 'goTo00': actionDisplay = 'go to (0,0)'; break;
                    case 'moveXY': actionDisplay = 'Move X+50,Y+50'; break;
                    case 'goRandom': actionDisplay = 'go to random position'; break;
                    case 'sayHello': actionDisplay = 'Say Hello'; break;
                    case 'sayHello1Sec': actionDisplay = 'Say Hello For 1 sec'; break;
                    case 'increaseSize': actionDisplay = 'Increase Size'; break;
                    case 'decreaseSize': actionDisplay = 'Dec Size'; break;
                    case 'repeat': actionDisplay = `Repeat x${REPEAT_COUNT}`; break;
                    default: actionDisplay = action;
                  }
                  
                  return (
                    <div 
                      key={index}
                      style={{ 
                        backgroundColor: '#85c0ff', 
                        padding: '10px', 
                        marginBottom: '5px', 
                        borderRadius: '4px',
                        position: 'relative'
                      }}
                    >
                      {actionDisplay}
                      <span 
                        style={{ 
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'red',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleDeleteSpriteAction(index)}
                      >
                        ×
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render - for regular screen
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ 
        backgroundColor: '#4a90e2', 
        padding: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div></div>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>ScrAtch</div>
        <button 
          style={{ 
            backgroundColor: '#4CAF50', 
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={handleReset}
        >
          ↻
        </button>
      </div>
      
      {/* Canvas for sprites */}
      <div 
        ref={canvasRef}
        style={{ 
          height: '50vh',
          border: '1px solid #eee',
          position: 'relative',
          backgroundColor: 'white',
          overflow: 'hidden'
        }}
      >
        {sprites.map(sprite => (
          <div 
            key={sprite.id}
            style={{ 
              position: 'absolute',
              left: `calc(50% + ${sprite.x}px)`, // Center + X offset
              top: `calc(50% - ${sprite.y}px)`, // Center - Y offset (inverted)
              transform: 'translate(-50%, -50%)', // Center the sprite itself
              cursor: isPlaying ? 'default' : 'move',
              userSelect: 'none',
              textAlign: 'center',
              transition: isPlaying ? 'left 0.5s ease-in-out, top 0.5s ease-in-out, transform 0.5s ease-in-out' : 'none',
              padding: '0',
              border: 'none',
              borderRadius: '0',
              zIndex: 5
            }}
            onMouseDown={(e) => handleMouseDown(e, sprite.id)}
            onTouchStart={(e) => handleTouchStart(e, sprite.id)}
            onClick={() => setActiveSpriteId(sprite.id)}
          >
            {message.text && message.spriteId === sprite.id && (
              <div style={{
                position: 'absolute',
                top: '-40px',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '15px',
                padding: '5px 10px',
                fontSize: '14px',
                zIndex: 10
              }}>
                {message.text}
              </div>
            )}
            
            {sprite.type === 'Cat' ? (
              <img 
                src="https://en.scratch-wiki.info/w/images/ScratchCat-Small.png" 
                alt="Cat"
                style={{ 
                  width: `${50 * sprite.size}px`, 
                  height: `${50 * sprite.size}px`,
                  filter: sprite.id === activeSpriteId ? 'drop-shadow(0 0 5px #4a90e2)' : 'none',
                  transform: sprite.rotation ? `rotate(${sprite.rotation}deg)` : 'none',
                  transition: isPlaying ? 'transform 1s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out' : 'none'
                }}
              />
            ) : (
              <img 
                src="/baseball.svg" 
                alt="Baseball"
                style={{ 
                  width: `${35 * sprite.size}px`, 
                  height: `${35 * sprite.size}px`,
                  filter: sprite.id === activeSpriteId ? 'drop-shadow(0 0 5px #4a90e2)' : 'none',
                  transform: sprite.rotation ? `rotate(${sprite.rotation}deg)` : 'none',
                  transition: isPlaying ? 'transform 1s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out' : 'none'
                }}
              />
            )}
          </div>
        ))}
        <button 
          style={{ 
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: '#4a90e2',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0px 2px 5px rgba(0,0,0,0.2)'
          }}
          onClick={handlePlay}
        >
          {isPlaying ? '⏳' : '▶'}
        </button>
      </div>
      
      {/* Coordinates display */}
      <div style={{ 
        borderBottom: '1px solid #eee',
        padding: '5px 10px',
        display: 'flex'
      }}>
        <div style={{ marginRight: '20px' }}>
          <span style={{ fontWeight: 'bold' }}>Sprite</span>
          {' '}
          <span style={{ 
            border: '1px solid #ddd', 
            padding: '2px 5px',
            marginLeft: '5px',
            backgroundColor: '#f0f0f0' 
          }}>
            {activeSprite?.type || 'None'}
          </span>
        </div>
        <div style={{ marginRight: '20px' }}>
          <span style={{ fontWeight: 'bold' }}>X</span>
          {' '}
          <span style={{ 
            border: '1px solid #ddd', 
            padding: '2px 5px',
            marginLeft: '5px' 
          }}>
            {activeSprite?.x || 0}
          </span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Y</span>
          {' '}
          <span style={{ 
            border: '1px solid #ddd', 
            padding: '2px 5px',
            marginLeft: '5px' 
          }}>
            {activeSprite?.y || 0}
          </span>
        </div>
      </div>
      
      {/* Sprite selector buttons */}
      {sprites.length > 1 && (
        <div style={{
          display: 'flex',
          padding: '5px 10px',
          gap: '10px',
          borderBottom: '1px solid #eee'
        }}>
          {sprites.map(sprite => (
            <button
              key={sprite.id}
              style={{
                backgroundColor: sprite.id === activeSpriteId ? '#4a90e2' : '#f0f0f0',
                color: sprite.id === activeSpriteId ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setActiveSpriteId(sprite.id)}
            >
              <img 
                src={sprite.type === 'Cat' 
                  ? "https://en.scratch-wiki.info/w/images/ScratchCat-Small.png" 
                  : "/baseball.svg"}
                alt={sprite.type}
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '5px'
                }}
              />
              {sprite.type}
            </button>
          ))}
        </div>
      )}
      
      {/* Action buttons */}
      <div style={{ padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ 
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'space-around'
        }}>
          {/* Add Actions button */}
          <div style={{
            flex: '1',
            maxWidth: '45%',
          }}>
            <button 
              style={{
                backgroundColor: '#4a90e2',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleAddActions}
            >
              Add Actions
            </button>
          </div>
          
          {/* Add Sprite button */}
          {sprites.length < 2 && (
            <div style={{
              flex: '1',
              maxWidth: '45%',
            }}>
              <button
                style={{
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={handleAddSprite}
              >
                <span style={{ fontSize: '24px', marginRight: '5px' }}>+</span>
                Add Sprite
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Action lists display below the buttons - only show if needed */}
      {activeSprite && (activeSprite.actions.length > 0 || activeSprite.actions2.length > 0) && (
        <div style={{ padding: '0 10px 10px 10px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '10px' 
          }}>
            <div style={{ fontWeight: 'bold' }}>Actions for {activeSprite.type}:</div>
            
            {/* Clear all actions button */}
            <button
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              onClick={() => {
                setSprites(prevSprites => 
                  prevSprites.map(sprite => 
                    sprite.id === activeSpriteId 
                      ? { ...sprite, actions: [], actions2: [] } 
                      : sprite
                  )
                );
              }}
            >
              Clear All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Display all actions with delete buttons */}
            {activeSprite.actions.map((action, index) => {
              let actionDisplay = action;
              
              // Show human-readable action name
              switch(action) {
                case 'moveX': actionDisplay = 'Move X by 50'; break;
                case 'moveY': actionDisplay = 'Move Y by 50'; break;
                case 'rotate': actionDisplay = 'Rotate 360'; break;
                case 'goTo00': actionDisplay = 'go to (0,0)'; break;
                case 'moveXY': actionDisplay = 'Move X+50,Y+50'; break;
                case 'goRandom': actionDisplay = 'go to random position'; break;
                case 'sayHello': actionDisplay = 'Say Hello'; break;
                case 'sayHello1Sec': actionDisplay = 'Say Hello For 1 sec'; break;
                case 'increaseSize': actionDisplay = 'Increase Size'; break;
                case 'decreaseSize': actionDisplay = 'Dec Size'; break;
                case 'repeat': actionDisplay = `Repeat x${REPEAT_COUNT}`; break;
                default: actionDisplay = action;
              }
              
              return (
                <div 
                  key={`action1-${index}`}
                  style={{ 
                    backgroundColor: '#f0f0f0',
                    padding: '5px 10px',
                    margin: '0 5px 5px 0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    position: 'relative',
                    paddingRight: '25px' // Space for delete button
                  }}
                >
                  A1: {actionDisplay}
                  <span
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Delete this specific action
                      const updatedActions = [...activeSprite.actions];
                      updatedActions.splice(index, 1);
                      setSprites(prevSprites => 
                        prevSprites.map(sprite => 
                          sprite.id === activeSpriteId 
                            ? { ...sprite, actions: updatedActions } 
                            : sprite
                        )
                      );
                    }}
                  >
                    ×
                  </span>
                </div>
              );
            })}
            
            {/* Display all actions2 */}
            {activeSprite.actions2.map((action, index) => {
              let actionDisplay = action;
              
              // Show human-readable action name
              switch(action) {
                case 'moveX': actionDisplay = 'Move X by 50'; break;
                case 'moveY': actionDisplay = 'Move Y by 50'; break;
                case 'rotate': actionDisplay = 'Rotate 360'; break;
                case 'goTo00': actionDisplay = 'go to (0,0)'; break;
                case 'moveXY': actionDisplay = 'Move X+50,Y+50'; break;
                case 'goRandom': actionDisplay = 'go to random position'; break;
                case 'sayHello': actionDisplay = 'Say Hello'; break;
                case 'sayHello1Sec': actionDisplay = 'Say Hello For 1 sec'; break;
                case 'increaseSize': actionDisplay = 'Increase Size'; break;
                case 'decreaseSize': actionDisplay = 'Dec Size'; break;
                case 'repeat': actionDisplay = `Repeat x${REPEAT_COUNT}`; break;
                default: actionDisplay = action;
              }
              
              return (
                <div 
                  key={`action2-${index}`}
                  style={{ 
                    backgroundColor: '#f0f0f0',
                    padding: '5px 10px',
                    margin: '0 5px 5px 0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    position: 'relative',
                    paddingRight: '25px' // Space for delete button
                  }}
                >
                  A2: {actionDisplay}
                  <span
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Delete this specific action from actions2
                      const updatedActions2 = [...activeSprite.actions2];
                      updatedActions2.splice(index, 1);
                      setSprites(prevSprites => 
                        prevSprites.map(sprite => 
                          sprite.id === activeSpriteId 
                            ? { ...sprite, actions2: updatedActions2 } 
                            : sprite
                        )
                      );
                    }}
                  >
                    ×
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
