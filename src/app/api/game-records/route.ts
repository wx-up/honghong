import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { userId, scenario, finalScore, result } = await request.json();

    // 验证输入
    if (!userId || !scenario || finalScore === undefined || !result) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (!['success', 'failure'].includes(result)) {
      return NextResponse.json(
        { error: '结果值无效' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 保存游戏记录
    const { data, error } = await client
      .from('game_records')
      .insert({
        user_id: userId,
        scenario,
        final_score: finalScore,
        result,
      })
      .select('id, played_at')
      .single();

    if (error) throw new Error(`保存失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      recordId: data.id,
    });

  } catch (error) {
    console.error('保存游戏记录失败:', error);
    return NextResponse.json(
      { error: '保存游戏记录失败' },
      { status: 500 }
    );
  }
}
