import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { Character, PRESET_SCENES } from '@/lib/types';
import { getSystemPrompt } from '@/lib/prompts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { character, scene, messages, userInput, angerValue } = await request.json();

    // 构建系统提示词
    const systemPrompt = getSystemPrompt(character as Character, angerValue);

    // 构建对话历史
    const conversationHistory = messages
      .map((m: { role: string; content: string }) => {
        const role = m.role === 'user' ? '用户' : '你';
        return `${role}：${m.content}`;
      })
      .join('\n');

    // 构建完整提示词
    const sceneInfo = PRESET_SCENES.find((s) => s.id === scene);
    const sceneText = sceneInfo
      ? `\n当前场景：${sceneInfo.name} - ${sceneInfo.description}`
      : '\n当前场景：自定义场景';

    const fullPrompt = `${systemPrompt}${sceneText}

对话历史：
${conversationHistory}

用户：${userInput}

你（继续回复，只说你自己的话）：`;

    // 获取自定义 headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController) {
        try {
          const msgs = [{ role: 'user' as const, content: fullPrompt }];
          const streamResult = client.stream(msgs, {
            temperature: 0.8,
          });

          for await (const chunk of streamResult) {
            if (chunk.content) {
              controller.enqueue(new TextEncoder().encode(chunk.content.toString()));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('对话生成失败', { status: 500 });
  }
}
