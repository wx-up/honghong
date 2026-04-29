'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame, generateId } from '@/lib/GameContext';
import { PRESET_SCENES, CHARACTER_CONFIG } from '@/lib/types';
import { getOpeningMessage } from '@/lib/prompts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Play } from 'lucide-react';

export default function ScenePage() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [customScene, setCustomScene] = useState('');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // 如果没有选择角色，跳转回首页
  if (!state.character) {
    router.push('/');
    return null;
  }

  // 如果没有选择声音，跳转到设置页面
  if (!state.voice) {
    router.push('/setup');
    return null;
  }

  const characterConfig = CHARACTER_CONFIG[state.character];

  const handleSelectScene = (sceneId: string) => {
    setSelectedSceneId(sceneId);
  };

  const handleStart = async () => {
    if (!selectedSceneId) return;

    setIsStarting(true);

    const scene = PRESET_SCENES.find((s) => s.id === selectedSceneId);
    if (!scene) return;

    // 设置场景
    dispatch({ type: 'SET_SCENE', payload: scene });

    // 生成开场白
    const openingMessage = getOpeningMessage(scene, state.character!);

    // 添加开场消息
    dispatch({
      type: 'START_GAME',
      payload: {
        id: generateId(),
        role: 'assistant',
        content: openingMessage,
        timestamp: Date.now(),
      },
    });

    // 跳转到对话页面
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 p-6">
      {/* 头部 */}
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">{characterConfig.emoji}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            选择哄 {characterConfig.name} 的场景
          </h1>
          <p className="text-gray-500">
            选择一个让 {characterConfig.name} 生气的场景
          </p>
        </div>

        {/* 场景列表 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {PRESET_SCENES.map((scene) => (
            <Card
              key={scene.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                selectedSceneId === scene.id
                  ? 'border-pink-400 bg-pink-50'
                  : 'border-gray-200'
              }`}
              onClick={() => handleSelectScene(scene.id)}
            >
              <CardContent className="p-4">
                <div className="text-3xl mb-2">{scene.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  {scene.name}
                </h3>
                <p className="text-sm text-gray-500">{scene.description}</p>
              </CardContent>
            </Card>
          ))}

          {/* 自定义场景 */}
          <Card
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
              selectedSceneId === 'custom'
                ? 'border-pink-400 bg-pink-50'
                : 'border-gray-200'
            }`}
            onClick={() => handleSelectScene('custom')}
          >
            <CardContent className="p-4">
              <div className="text-3xl mb-2">✏️</div>
              <h3 className="font-semibold text-gray-800 mb-1">自定义场景</h3>
              <p className="text-sm text-gray-500">输入你自己的场景</p>
            </CardContent>
          </Card>
        </div>

        {/* 自定义输入框 */}
        {selectedSceneId === 'custom' && (
          <div className="mb-6">
            <Input
              placeholder="描述一个让ta生气的场景..."
              value={customScene}
              onChange={(e) => setCustomScene(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* 开始按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={handleStart}
            disabled={!selectedSceneId || (selectedSceneId === 'custom' && !customScene.trim()) || isStarting}
            className="px-8 py-6 text-lg bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
          >
            {isStarting ? (
              <span>加载中...</span>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                开始哄
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
