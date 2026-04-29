'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Trophy, Target, TrendingUp, Calendar, Loader2 } from 'lucide-react';

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: 'success' | 'failure';
  played_at: string;
}

interface Stats {
  totalGames: number;
  wins: number;
  winRate: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ totalGames: 0, wins: 0, winRate: 0 });
  const [loading, setLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 获取游戏记录
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/game-records/my?userId=${user.id}`);
      const data = await response.json();
      
      if (data.records) {
        setRecords(data.records);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取游戏记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 未登录或加载中
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-pink-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-pink-500" />
              <h1 className="font-bold text-gray-800">个人中心</h1>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {/* 用户信息 */}
        <Card className="border-pink-100 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full flex items-center justify-center">
                <span className="text-3xl text-white font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{user.username}</h2>
                <p className="text-sm text-gray-500">哄哄模拟器练习生</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-pink-100">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold text-gray-800">{stats.totalGames}</p>
              <p className="text-xs text-gray-500">总场次</p>
            </CardContent>
          </Card>

          <Card className="border-pink-100">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-gray-800">{stats.wins}</p>
              <p className="text-xs text-gray-500">胜利次数</p>
            </CardContent>
          </Card>

          <Card className="border-pink-100">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-800">{stats.winRate}%</p>
              <p className="text-xs text-gray-500">胜率</p>
            </CardContent>
          </Card>
        </div>

        {/* 游戏记录列表 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-500" />
            历史记录
          </h3>

          {records.length === 0 ? (
            <Card className="border-pink-100">
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">🎮</div>
                <p className="text-gray-500 mb-4">还没有游戏记录</p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                >
                  开始游戏
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Card key={record.id} className="border-pink-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.result === 'success' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {record.result === 'success' ? '🎉' : '😅'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{record.scenario}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(record.played_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          record.result === 'success' ? 'text-green-500' : 'text-gray-500'
                        }`}>
                          {record.result === 'success' ? '成功' : '失败'}
                        </p>
                        <p className="text-xs text-gray-400">
                          好感度: {record.final_score}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
