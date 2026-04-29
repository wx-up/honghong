import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();
    
    if (!topic) {
      return NextResponse.json(
        { error: '请提供文章主题' },
        { status: 400 }
      );
    }

    // 调用 LLM 生成文章内容
    const prompt = `请为"哄哄模拟器"（一个帮助用户练习如何哄生气的人的模拟器）生成一篇恋爱沟通技巧文章。

主题：${topic}

要求：
1. 文章标题要吸引人，包含emoji
2. 摘要控制在50字以内
3. 正文使用Markdown格式（**加粗**，❌ ✅列表）
4. 内容要实用、有干货，包含具体的方法或技巧
5. 适合在情侣之间沟通的场景
6. 字数800-1200字

请直接返回JSON格式（不要有其他说明）：
{
  "title": "标题",
  "summary": "摘要",
  "content": "正文内容（Markdown格式）"
}`;

    // 使用 Node.js 的 child_process 执行简单的 curl 调用
    const { execSync } = await import('child_process');
    
    // 由于 gptscript 可能不可用，我们使用一个更简单的方法
    // 通过环境中的 LLM API 直接生成
    const apiUrl = process.env.LLM_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const apiKey = process.env.LLM_API_KEY || process.env.ARK_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'LLM API 未配置' },
        { status: 500 }
      );
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'doubao-seed-1.8-250428',
        messages: [
          { role: 'system', content: '你是一个恋爱技巧专家，擅长写实用、有趣的恋爱沟通文章。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API 调用失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('LLM 返回内容为空');
    }

    // 解析 JSON
    let article;
    try {
      // 尝试提取 JSON（可能包含在代码块中）
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      article = JSON.parse(jsonMatch[1] || content);
    } catch {
      // 如果 JSON 解析失败，返回原始内容
      article = {
        title: `关于${topic}的恋爱技巧`,
        summary: `本文探讨了${topic}这一恋爱沟通话题。`,
        content: content
      };
    }

    // 保存到数据库
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('blog_posts')
      .insert({
        title: article.title,
        summary: article.summary,
        content: article.content
      })
      .select()
      .single();
    
    if (error) throw new Error(`保存失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      post: data
    });

  } catch (error) {
    console.error('生成文章失败:', error);
    return NextResponse.json(
      { error: '生成文章失败' },
      { status: 500 }
    );
  }
}
