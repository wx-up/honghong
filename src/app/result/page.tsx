'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/GameContext';
import { useAuth } from '@/lib/AuthContext';
import { CHARACTER_CONFIG } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Download, PartyPopper, Frown, Save } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ResultPage() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 如果没有结果，跳转回首页
  if (state.isSuccess === null) {
    router.push('/');
    return null;
  }

  // 保存游戏记录
  const saveGameRecord = async () => {
    if (!user) {
      setSaveMessage('登录后可保存你的游戏记录');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    if (saved) return;

    try {
      const response = await fetch('/api/game-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          scenario: state.scene?.name || '自定义场景',
          finalScore: 100 - state.angerValue, // 转换为好感度分数
          result: state.isSuccess ? 'success' : 'failure',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSaved(true);
        setSaveMessage('您的游戏记录已经保存');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  };

  // 游戏结束时自动保存
  useEffect(() => {
    saveGameRecord();
  }, []);

  const characterConfig = state.character ? CHARACTER_CONFIG[state.character] : null;
  const isSuccess = state.isSuccess === true;

  // 重新开始
  const handleRestart = () => {
    dispatch({ type: 'RESET' });
    router.push('/');
  };

  // 再来一次（同一角色）
  const handleRetry = () => {
    dispatch({ type: 'RESET' });
    router.push('/scene');
  };

  // 生成分享卡片
  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#fff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `哄哄模拟器_${isSuccess ? '成功' : '失败'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 计算回合数
  const roundCount = Math.floor(state.messages.filter((m) => m.role === 'user').length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 flex flex-col items-center justify-center p-6">
      {/* 保存提示 */}
      {saveMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-pink-500 text-white rounded-full shadow-lg animate-pulse z-50">
          {saveMessage}
        </div>
      )}

      {/* 结果展示卡片 */}
      <div
        ref={cardRef}
        className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border-4 border-pink-100"
      >
        {/* 结果图标 */}
        <div className={`text-8xl mb-6 ${isSuccess ? 'animate-bounce' : ''}`}>
          {isSuccess ? (
            <div>
              <PartyPopper className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
              <div className="text-6xl">🎉</div>
            </div>
          ) : (
            <div>
              <Frown className="w-24 h-24 mx-auto text-gray-400 mb-4" />
              <div className="text-6xl">😅</div>
            </div>
          )}
        </div>

        {/* 结果文字 */}
        <h1 className={`text-3xl font-bold mb-4 ${isSuccess ? 'text-green-500' : 'text-gray-600'}`}>
          {isSuccess ? '哄好了！' : '哄崩了...'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isSuccess
            ? `太棒了！只用了 ${roundCount} 回合就把 ${characterConfig?.name} 哄好了！`
            : `哎呀，${roundCount} 回合后还是崩了...${characterConfig?.name} 选择冷静一下`}
        </p>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-pink-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">最终怒气值</p>
            <p className={`text-2xl font-bold ${state.angerValue <= 30 ? 'text-green-500' : 'text-red-500'}`}>
              {state.angerValue}
            </p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">对话回合</p>
            <p className="text-2xl font-bold text-pink-500">{roundCount}</p>
          </div>
        </div>

        {/* 角色信息 */}
        <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
          <span className="text-4xl">{characterConfig?.emoji}</span>
          <div className="text-left">
            <p className="font-semibold text-gray-800">{characterConfig?.name}</p>
            <p className="text-sm text-gray-500">{state.scene?.name}</p>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-4xl">
          {isSuccess ? '💕✨💕' : '🤔💭'}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <Button
          onClick={handleRestart}
          variant="outline"
          className="px-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          重新开始
        </Button>

        <Button
          onClick={handleRetry}
          className="px-6 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          再来一次
        </Button>

        <Button
          onClick={handleShare}
          className="px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Download className="w-4 h-4 mr-2" />
          保存卡片
        </Button>

        {/* 查看记录按钮 - 仅登录用户显示 */}
        {user && (
          <Button
            onClick={() => router.push('/profile')}
            variant="outline"
            className="px-6 border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            <Save className="w-4 h-4 mr-2" />
            我的记录
          </Button>
        )}
      </div>

      {/* 提示 */}
      <p className="mt-6 text-sm text-gray-400">
        {isSuccess
          ? '恭喜你掌握了哄人的技巧！'
          : '别灰心，多练习几次就能掌握窍门了！'}
      </p>
    </div>
  );
}
