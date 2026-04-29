'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGame, generateId } from '@/lib/GameContext';
import { CHARACTER_CONFIG, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Send, Volume2, Sparkles, Mic } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const [userInput, setUserInput] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastProcessedMessageId = useRef<string | null>(null);
  const hasGeneratedForCurrentMessage = useRef<string | null>(null);

  // 检查游戏是否开始
  const isGameStarted = state.character && state.scene && state.isPlaying;

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, streamingContent]);

  // 获取选项
  const fetchOptions = useCallback(async () => {
    setIsGeneratingOptions(true);
    try {
      const response = await fetch('/api/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: state.character,
          scene: state.scene?.id,
          angerValue: state.angerValue,
          lastMessage: state.messages[state.messages.length - 1]?.content || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOptions(data.options);
      }
    } catch (error) {
      console.error('获取选项失败:', error);
    } finally {
      setIsGeneratingOptions(false);
    }
  }, [state.character, state.scene?.id, state.angerValue, state.messages]);

  // 为开场白生成语音（只在开场白完成后一次）
  useEffect(() => {
    if (state.messages.length === 1 && state.messages[0].role === 'assistant' && state.messages[0].content && state.messages[0].content !== '正在思考...') {
      const timer = setTimeout(() => {
        generateVoice(state.messages[0].content);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.messages.length, state.messages[0]?.content]);

  // 检查游戏是否结束并跳转
  useEffect(() => {
    if (state.isSuccess === true || state.isSuccess === false) {
      router.push('/result');
    }
  }, [state.isSuccess, router]);

  // 如果游戏没有开始，跳转回首页
  useEffect(() => {
    if (!isGameStarted) {
      router.push('/');
    }
  }, [isGameStarted, router]);

  // 根据消息变化自动生成语音和选项（使用 ref 防止重复触发）
  useEffect(() => {
    // 跳过加载中、用户消息、流式输出中的消息
    if (isLoading) return;
    if (state.messages.length === 0) return;

    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.content || lastMessage.content === '正在思考...') return;

    // 检查是否是新消息（使用 ID 判断）
    const messageId = lastMessage.id;
    if (hasGeneratedForCurrentMessage.current === messageId) return;
    hasGeneratedForCurrentMessage.current = messageId;

    // 延迟生成语音和选项
    const timer = setTimeout(() => {
      generateVoice(lastMessage.content);
      fetchOptions();
    }, 500);

    return () => clearTimeout(timer);
  }, [state.messages.length, state.messages[state.messages.length - 1]?.id, isLoading]);

  // 如果游戏没有开始，返回 null
  if (!isGameStarted) {
    return null;
  }

  const characterConfig = CHARACTER_CONFIG[state.character!];

  // 生成语音
  const generateVoice = async (text: string) => {
    if (!text || text === '正在思考...') return;

    setIsAudioLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          character: state.character,
          voiceId: state.voice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentAudioUrl(data.audioUrl);
      }
    } catch (error) {
      console.error('生成语音失败:', error);
    } finally {
      setIsAudioLoading(false);
    }
  };

  // 发送消息
  const handleSend = async (content?: string) => {
    const messageText = content || userInput.trim();
    if (!messageText || isLoading) return;

    setIsLoading(true);
    setUserInput('');
    setOptions([]);
    setCurrentAudioUrl(null);
    setStreamingContent('');
    hasGeneratedForCurrentMessage.current = null;

    // 添加用户消息
    dispatch({
      type: 'ADD_USER_MESSAGE',
      payload: {
        id: generateId(),
        role: 'user',
        content: messageText,
        timestamp: Date.now(),
      },
    });

    try {
      // 发送消息并流式获取回复
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: state.character,
          scene: state.scene?.id,
          messages: state.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userInput: messageText,
          angerValue: state.angerValue,
        }),
      });

      if (!response.ok) {
        throw new Error('API 请求失败');
      }

      // 流式读取响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // 添加一条空的助手消息
      const tempMessageId = generateId();
      dispatch({
        type: 'ADD_ASSISTANT_MESSAGE',
        payload: {
          id: tempMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        },
      });

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullContent += chunk;
        setStreamingContent(fullContent);

        // 更新最后一条消息内容
        dispatch({
          type: 'UPDATE_LAST_MESSAGE',
          payload: fullContent,
        });
      }

      // 流式完成后，用完整内容生成语音
      setStreamingContent('');
      await generateVoice(fullContent);

      // 获取怒气值变化
      const judgeResponse = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: messageText,
          character: state.character,
          context: fullContent,
        }),
      });

      if (judgeResponse.ok) {
        const judgeData = await judgeResponse.json();
        dispatch({ type: 'UPDATE_ANGER', payload: judgeData.angerChange });
      }

      // 获取新选项
      await fetchOptions();

    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  // 选择选项
  const handleSelectOption = async (option: Option) => {
    await handleSend(option.text);
  };

  // 播放语音
  const handlePlayVoice = () => {
    if (currentAudioUrl) {
      const audio = new Audio(currentAudioUrl);
      audio.play();
    }
  };

  // 获取怒气值颜色
  const getAngerColor = () => {
    if (state.angerValue <= 30) return 'text-green-500';
    if (state.angerValue <= 60) return 'text-yellow-500';
    if (state.angerValue <= 80) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 flex flex-col">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/scene')}
              className="p-2 hover:bg-pink-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-2xl">{characterConfig.emoji}</span>
            <div>
              <h1 className="font-semibold text-gray-800">
                {characterConfig.name}
              </h1>
              <p className="text-xs text-gray-500">正在生气中...</p>
            </div>
          </div>

          {/* 怒气值 */}
          <div className="text-right">
            <p className={`text-sm font-semibold ${getAngerColor()}`}>
              怒气值 {state.angerValue}
            </p>
            <Progress
              value={state.angerValue}
              className="w-20 h-2 mt-1 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-red-400 [&>[role=progressbar]]:to-orange-400"
            />
          </div>
        </div>
      </header>

      {/* 对话区域 */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 pb-32 overflow-y-auto">
        <div className="space-y-4">
          {state.messages.map((message) => {
            const isLastAssistantMessage =
              message.role === 'assistant' &&
              message.id === state.messages[state.messages.length - 1].id;

            return (
              <div key={message.id}>
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-md'
                        : 'bg-white border border-pink-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>

                {/* 语音播放按钮 - 只在最后一条助手消息且有音频或正在加载时显示 */}
                {message.role === 'assistant' && isLastAssistantMessage && (currentAudioUrl || isAudioLoading) && !streamingContent && (
                  <div className="flex justify-start mt-1 ml-2">
                    <button
                      onClick={handlePlayVoice}
                      disabled={!currentAudioUrl}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
                        currentAudioUrl
                          ? 'bg-pink-100 hover:bg-pink-200 text-pink-600 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-wait'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{currentAudioUrl ? '点击播放' : '生成中...'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* 正在输入的流式内容 */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border border-pink-100 text-gray-800 rounded-bl-md">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-pink-400 ml-1 animate-pulse" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 提示选项 */}
      {options.length > 0 && !isLoading && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-pink-100 p-4 shadow-lg z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>选择一句话哄 ta</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {options.slice(0, 6).map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    option.angerChange < 0
                      ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                      : option.angerChange < 5
                      ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 加载中 */}
      {isGeneratingOptions && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-pink-100 p-4 shadow-lg z-10">
          <div className="max-w-2xl mx-auto text-center text-gray-500">
            <Sparkles className="w-4 h-4 mx-auto mb-2 animate-spin" />
            <p className="text-sm">生成哄人选项中...</p>
          </div>
        </div>
      )}

      {/* 输入框 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 p-4 z-20">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="输入你想说的话..."
            className="flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!userInput.trim() || isLoading}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            {isLoading ? (
              <span className="animate-spin">
                <Sparkles className="w-5 h-5" />
              </span>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
