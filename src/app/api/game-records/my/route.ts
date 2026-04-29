import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取用户的游戏记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('game_records')
      .select('id, scenario, final_score, result, played_at')
      .eq('user_id', parseInt(userId))
      .order('played_at', { ascending: false });

    if (error) throw new Error(`查询失败: ${error.message}`);

    // 计算统计数据
    const totalGames = data?.length || 0;
    const wins = data?.filter(r => r.result === 'success').length || 0;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return NextResponse.json({
      records: data || [],
      stats: {
        totalGames,
        wins,
        winRate,
      },
    });

  } catch (error) {
    console.error('获取游戏记录失败:', error);
    return NextResponse.json(
      { error: '获取游戏记录失败' },
      { status: 500 }
    );
  }
}
