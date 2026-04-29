import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { Character } from '@/lib/types';
import { getOptionsPrompt } from '@/lib/prompts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { character, angerValue, lastMessage } = await request.json();

    const characterName = character === 'girlfriend' ? '女朋友' : '男朋友';

    let prompt = getOptionsPrompt(character as Character, angerValue);

    if (lastMessage) {
      prompt += `\n\n${characterName}刚才说：\n"${lastMessage}"`;
    }

    // 获取自定义 headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [{ role: 'user' as const, content: prompt }];

    const response = await client.invoke(messages, {
      temperature: 0.9,
    });

    // 解析 JSON 响应
    let result;
    try {
      result = JSON.parse(response.content);
    } catch {
      // 如果解析失败，返回默认选项（4加分+2减分）
      result = {
        options: [
          { text: '对不起亲爱的，我错了，以后再也不会了', angerChange: -10 },
          { text: '别生气了嘛，我给你揉揉肩好不好？', angerChange: -8 },
          { text: '我带你去吃你最喜欢的火锅好不好？', angerChange: -9 },
          { text: '我知道你受委屈了，让我好好补偿你', angerChange: -7 },
          { text: '行行行我错了行了吧，你别生气了', angerChange: 10 },
          { text: '我也很难受啊，你就不能理解我一下吗', angerChange: 12 },
        ],
      };
    }

    // 为每个选项添加唯一ID
    const options = result.options.map((opt: { text: string; angerChange: number }, index: number) => ({
      id: `opt_${Date.now()}_${index}`,
      text: opt.text,
      angerChange: Math.max(-20, Math.min(20, opt.angerChange)),
    }));

    return NextResponse.json({ options });

  } catch (error) {
    console.error('Options API error:', error);
    return NextResponse.json(
      {
        options: [
          { id: 'default_1', text: '对不起亲爱的，我知道错了', angerChange: -10 },
          { id: 'default_2', text: '别生气了，我请你吃大餐补偿你', angerChange: -10 },
          { id: 'default_3', text: '我很在乎你，真的，原谅我好不好', angerChange: -8 },
          { id: 'default_4', text: '下次一定注意，给你准备个惊喜', angerChange: -7 },
          { id: 'default_5', text: '我知道你受委屈了，让我好好弥补', angerChange: -5 },
          { id: 'default_6', text: '我真的知道问题在哪了，再给我一次机会', angerChange: -5 },
        ],
      },
      { status: 200 }
    );
  }
}
