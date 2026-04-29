'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/GameContext';
import { useAuth } from '@/lib/AuthContext';
import { CHARACTER_CONFIG, GIRLFRIEND_VOICES, BOYFRIEND_VOICES, VoiceOption } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, BookOpen, Volume2, Play, User, LogOut } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { user, loading, logout } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState<'girlfriend' | 'boyfriend' | null>(state.character);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 获取当前角色的声音列表
  const voices = selectedCharacter === 'girlfriend' ? GIRLFRIEND_VOICES : 
                 selectedCharacter === 'boyfriend' ? BOYFRIEND_VOICES : [];

  // 处理角色选择
  const handleSelectCharacter = (character: 'girlfriend' | 'boyfriend') => {
    setSelectedCharacter(character);
    setSelectedVoice(null);
    dispatch({ type: 'SET_CHARACTER', payload: character });
  };

  // 处理声音选择
  const handleSelectVoice = (voice: VoiceOption) => {
    setSelectedVoice(voice.id);
    dispatch({ type: 'SET_VOICE', payload: voice.id as any });
  };

  // 开始游戏
  const handleStartGame = () => {
    if (selectedCharacter && selectedVoice) {
      dispatch({ type: 'SET_CHARACTER', payload: selectedCharacter });
      dispatch({ type: 'SET_VOICE', payload: selectedVoice as any });
      router.push('/scene');
    }
  };

  // 试听声音
  const handlePreview = async (voice: VoiceOption) => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '你好呀，我来测试一下这个声音，你觉得怎么样？',
          voiceId: voice.id,
          character: selectedCharacter,
        }),
      });
      
      const data = await response.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 flex flex-col items-center justify-center p-6">
      {/* 用户登录状态 */}
      <div className="absolute top-4 right-4">
        {loading ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors"
            >
              <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user.username}</span>
            </button>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-pink-600"
            >
              登录
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
            >
              注册
            </Button>
          </div>
        )}
      </div>

      {/* Logo区域 */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">💕</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">哄哄模拟器</h1>
        <p className="text-gray-500 max-w-md">
          提前演练如何哄生气的人，让你们的感情更加稳固
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${selectedCharacter ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
          <span className="font-medium">1</span>
          <span>选择对象</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${selectedVoice ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
          <span className="font-medium">2</span>
          <span>选择声音</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-400">
          <span className="font-medium">3</span>
          <span>开始游戏</span>
        </div>
      </div>

      {/* 角色选择区域 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
          {selectedCharacter ? '已选择：' + CHARACTER_CONFIG[selectedCharacter].name : '选择你要哄的对象'}
        </h2>
        
        <div className="flex gap-6 flex-wrap justify-center">
          {(['girlfriend', 'boyfriend'] as const).map((char) => {
            const config = CHARACTER_CONFIG[char];
            const isSelected = selectedCharacter === char;
            return (
              <Card
                key={char}
                className={`w-40 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isSelected 
                    ? 'border-pink-500 shadow-lg ring-2 ring-pink-200' 
                    : 'border-2 hover:border-pink-400'
                }`}
                onClick={() => handleSelectCharacter(char)}
              >
                <CardContent className="p-5 text-center">
                  <div className="text-5xl mb-3">{config.emoji}</div>
                  <h3 className="text-base font-semibold text-gray-800">
                    {config.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {char === 'girlfriend' ? '傲娇小公主' : '内敛大男孩'}
                  </p>
                  {isSelected && (
                    <div className="mt-2 text-xs text-pink-500 font-medium">已选择 ✓</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 声音选择区域 - 仅在选择角色后显示 */}
      {selectedCharacter && (
        <div className="w-full max-w-3xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-center gap-2">
            <Volume2 className="w-5 h-5 text-pink-500" />
            选择{selectedCharacter === 'girlfriend' ? '女朋友' : '男朋友'}的声音
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {voices.map((voice) => (
              <Card
                key={voice.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  selectedVoice === voice.id
                    ? 'border-pink-500 shadow-lg ring-2 ring-pink-200'
                    : 'border-gray-200 hover:border-pink-300 hover:shadow-md'
                }`}
                onClick={() => handleSelectVoice(voice)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-2">{voice.emoji}</div>
                    <h4 className="font-semibold text-gray-800">{voice.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{voice.description}</p>
                    
                    {/* 试听按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(voice);
                      }}
                      disabled={isGenerating}
                      className="mt-3 flex items-center gap-1 px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-full text-sm transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      试听
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 开始游戏按钮 */}
      {selectedCharacter && (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-100">
          <Button
            onClick={handleStartGame}
            disabled={!selectedVoice}
            className="px-10 py-6 text-lg bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 mr-2" />
            {selectedVoice ? '开始哄人' : '请先选择声音'}
          </Button>
        </div>
      )}

      {/* 底部提示 */}
      <div className="mt-4 flex flex-col items-center gap-4">
        <button
          onClick={() => router.push('/blog')}
          className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-pink-50 text-gray-600 hover:text-pink-600 border border-pink-200 rounded-full shadow-sm hover:shadow-md transition-all"
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">恋爱攻略</span>
        </button>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Heart className="w-4 h-4" />
          <span>选择对象和声音后开始你的哄人练习</span>
        </div>
      </div>
    </div>
  );
}
