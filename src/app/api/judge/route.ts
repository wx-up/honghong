import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getJudgePrompt } from '@/lib/prompts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userInput, character, context } = await request.json();

    const characterName = character === 'girlfriend' ? '女朋友' : '男朋友';

    const prompt = `${getJudgePrompt()}

用户刚才对${characterName}说：
"${userInput}"

${characterName}的回应：
"${context}"

请判断用户的话对${characterName}是否有效：`;

    // 获取自定义 headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [{ role: 'user' as const, content: prompt }];

    const response = await client.invoke(messages, {
      temperature: 0.3,
    });

    // 解析 JSON 响应
    let result;
    try {
      result = JSON.parse(response.content);
    } catch {
      // 如果解析失败，使用默认判断
      result = {
        angerChange: -5,
        reason: '判断失败，使用默认值',
        score: 3,
      };
    }

    // 确保 angerChange 在有效范围内（-20 到 +20）
    result.angerChange = Math.max(-20, Math.min(20, result.angerChange));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Judge API error:', error);
    return NextResponse.json(
      {
        angerChange: -5,
        reason: '判断出错，使用默认值',
        score: 3,
      },
      { status: 200 }
    );
  }
}
