import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { CHARACTER_CONFIG, getVoiceConfig, Character, Voice } from '@/lib/types';

export const dynamic = 'force-dynamic';

// 获取完整音频 URL
function getFullAudioUrl(audioUri: string): string {
  // 如果已经是完整 URL，直接返回
  if (audioUri.startsWith('http://') || audioUri.startsWith('https://')) {
    return audioUri;
  }
  
  // 如果是相对路径，拼接域名
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'localhost:5001'}`;
  return `${baseUrl}${audioUri.startsWith('/') ? '' : '/'}${audioUri}`;
}

export async function POST(request: NextRequest) {
  try {
    const { text, character, voiceId } = await request.json();

    let speaker: string;

    if (voiceId) {
      // 使用用户选择的声音
      const voiceConfig = getVoiceConfig(character as Character, voiceId as Voice);
      speaker = voiceConfig.speaker;
    } else {
      // 使用默认音色
      speaker = CHARACTER_CONFIG[character as keyof typeof CHARACTER_CONFIG]?.ttsSpeaker || 'saturn_zh_female_keainvsheng_tob';
    }

    // 获取自定义 headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建 TTS 客户端
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    const response = await client.synthesize({
      uid: `user_${Date.now()}`,
      text,
      speaker,
      audioFormat: 'mp3',
      sampleRate: 24000,
    });

    return NextResponse.json({
      audioUrl: getFullAudioUrl(response.audioUri),
      audioSize: response.audioSize,
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: '语音生成失败' },
      { status: 500 }
    );
  }
}
