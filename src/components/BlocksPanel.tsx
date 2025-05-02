import React, { useState } from 'react';
import { Block, BlockCategory } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface BlocksPanelProps {
  onAddBlock: (block: Block) => void;
}

// Define block categories with their available blocks
const blockCategories: BlockCategory[] = [
  {
    name: 'Motion',
    color: 'bg-blue-500',
    blocks: [
      {
        name: 'Move X by 50',
        action: 'move',
        params: {
          steps: {
            type: 'number',
            defaultValue: 50
          },
          direction: {
            type: 'text',
            defaultValue: 'x'
          }
        }
      },
      {
        name: 'Move Y by 50',
        action: 'move',
        params: {
          steps: {
            type: 'number',
            defaultValue: 50
          },
          direction: {
            type: 'text',
            defaultValue: 'y'
          }
        }
      },
      {
        name: 'Rotate 360',
        action: 'turn',
        params: {
          degrees: {
            type: 'number',
            defaultValue: 360
          }
        }
      },
      {
        name: 'go to (0,0)',
        action: 'goto',
        params: {
          x: {
            type: 'number',
            defaultValue: 0
          },
          y: {
            type: 'number',
            defaultValue: 0
          }
        }
      },
      {
        name: 'Move X+50,Y+50',
        action: 'move',
        params: {
          dx: {
            type: 'number',
            defaultValue: 50
          },
          dy: {
            type: 'number',
            defaultValue: 50
          }
        }
      },
      {
        name: 'go to random position',
        action: 'random',
        params: {
          enabled: {
            type: 'text',
            defaultValue: 'true'
          }
        }
      }
    ]
  },
  {
    name: 'Looks',
    color: 'bg-purple-500',
    blocks: [
      {
        name: 'Say Hello',
        action: 'say',
        params: {
          message: {
            type: 'text',
            defaultValue: 'Hello!'
          },
          seconds: {
            type: 'number',
            defaultValue: 1
          }
        }
      },
      {
        name: 'Say Hello For 1 sec',
        action: 'say',
        params: {
          message: {
            type: 'text',
            defaultValue: 'Hello!'
          },
          seconds: {
            type: 'number',
            defaultValue: 1
          }
        }
      },
      {
        name: 'Increase Size',
        action: 'size',
        params: {
          change: {
            type: 'number',
            defaultValue: 10
          }
        }
      },
      {
        name: 'Dec Size',
        action: 'size',
        params: {
          change: {
            type: 'number',
            defaultValue: -10
          }
        }
      }
    ]
  },
  {
    name: 'Control',
    color: 'bg-yellow-500',
    blocks: [
      {
        name: 'Repeat x5',
        action: 'repeat',
        params: {
          times: {
            type: 'number',
            defaultValue: 5
          }
        }
      },
      {
        name: 'Hero Feature: On collision swap',
        action: 'heroCollision',
        params: {
          enabled: {
            type: 'text',
            defaultValue: 'true'
          }
        }
      }
    ]
  }
];

const BlocksPanel: React.FC<BlocksPanelProps> = ({ onAddBlock }) => {
  // Create a block when clicked and add it to the active sprite
  const handleBlockClick = (categoryName: string, blockInfo: any) => {
    // Convert default values to parameter object
    const params: any = {};
    Object.entries(blockInfo.params).forEach(([key, value]: [string, any]) => {
      params[key] = value.defaultValue;
    });
    
    const block: Block = {
      id: uuidv4(),
      type: categoryName.toLowerCase() as 'motion' | 'looks',
      action: blockInfo.action,
      params
    };
    
    onAddBlock(block);
  };
  
  return (
    <div className="flex flex-col space-y-2 w-full">
      {/* Motion blocks */}
      {blockCategories.map((category) => (
        <React.Fragment key={category.name}>
          {category.blocks.map((block, index) => (
            <div
              key={`${category.name}-${index}`}
              className={`${category.name === 'Motion' ? 'bg-blue-500' : category.name === 'Looks' ? 'bg-purple-500' : 'bg-yellow-500'} 
                text-white p-3 rounded cursor-pointer hover:opacity-90`}
              onClick={() => handleBlockClick(category.name, block)}
              >
              {block.name}
            </div>
          ))}
        </React.Fragment>
                  ))}
    </div>
  );
};

export default BlocksPanel; 