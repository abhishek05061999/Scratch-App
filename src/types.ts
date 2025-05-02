export interface Position {
  x: number;
  y: number;
}

export interface BlockParam {
  [key: string]: string | number;
}

export interface Block {
  id: string;
  type: 'motion' | 'looks' | 'events' | 'control';
  action: string;
  params: BlockParam;
}

export interface Sprite {
  id: string;
  name: string;
  x: number;
  y: number;
  image: string;
  color: string;
  blocks: Block[];
  isRunning: boolean;
  direction?: number; // Direction in degrees
  steps?: number; // Number of steps to move
}

export interface BlockCategory {
  name: string;
  color: string;
  blocks: {
    name: string;
    action: string;
    params: {
      [key: string]: {
        type: 'number' | 'text';
        defaultValue: string | number;
      }
    }
  }[];
} 