'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, Character, Scene, Message, Voice } from './types';

// 初始状态
const initialState: GameState = {
  character: null,
  voice: null,
  scene: null,
  customScene: null,
  angerValue: 50,
  messages: [],
  isPlaying: false,
  isSuccess: null,
};

// Action 类型
type GameAction =
  | { type: 'SET_CHARACTER'; payload: Character }
  | { type: 'SET_VOICE'; payload: Voice }
  | { type: 'SET_SCENE'; payload: Scene }
  | { type: 'SET_CUSTOM_SCENE'; payload: string }
  | { type: 'START_GAME'; payload: Message }
  | { type: 'ADD_USER_MESSAGE'; payload: Message }
  | { type: 'ADD_ASSISTANT_MESSAGE'; payload: Message }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: string }
  | { type: 'UPDATE_ANGER'; payload: number }
  | { type: 'SET_SUCCESS' }
  | { type: 'SET_FAILURE' }
  | { type: 'RESET' };

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CHARACTER':
      return { ...state, character: action.payload, voice: null };
    case 'SET_VOICE':
      return { ...state, voice: action.payload };
    case 'SET_SCENE':
      return { ...state, scene: action.payload };
    case 'SET_CUSTOM_SCENE':
      return { ...state, customScene: action.payload };
    case 'START_GAME':
      return {
        ...state,
        angerValue: 50,
        messages: [action.payload],
        isPlaying: true,
        isSuccess: null,
      };
    case 'ADD_USER_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'ADD_ASSISTANT_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_LAST_MESSAGE':
      const messages = [...state.messages];
      if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content: action.payload,
          timestamp: Date.now(),
        };
      }
      return { ...state, messages };
    case 'UPDATE_ANGER':
      const newAnger = Math.max(0, Math.min(100, state.angerValue + action.payload));
      return {
        ...state,
        angerValue: newAnger,
        isSuccess: newAnger <= 0 ? true : newAnger >= 100 ? false : null,
      };
    case 'SET_SUCCESS':
      return { ...state, isSuccess: true, isPlaying: false };
    case 'SET_FAILURE':
      return { ...state, isSuccess: false, isPlaying: false };
    case 'RESET':
      return {
        ...initialState,
        character: state.character,
        voice: state.voice,
      };
    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// 辅助函数：生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
