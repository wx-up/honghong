'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Sparkles, Loader2 } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('获取文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTopic('');
        setShowTopicInput(false);
        fetchPosts(); // 刷新列表
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      console.error('生成文章失败:', error);
      alert('生成文章失败');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-pink-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-500" />
              <h1 className="font-bold text-gray-800">恋爱攻略</h1>
            </div>
          </div>
          
          {/* AI 生成按钮 */}
          <Button
            onClick={() => setShowTopicInput(!showTopicInput)}
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI 生成
          </Button>
        </div>
      </header>

      {/* AI 生成输入区域 */}
      {showTopicInput && (
        <div className="max-w-2xl mx-auto px-6 pt-6">
          <Card className="border-pink-200 bg-pink-50/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                AI 智能生成文章
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                输入一个恋爱话题，AI 将为你生成一篇实用的沟通技巧文章
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：如何异地恋保持亲密感"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  disabled={generating}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !topic.trim()}
                  className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      生成中
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      生成
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 内容区域 */}
      <main className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">干货满满的恋爱技巧</h2>
          <p className="text-gray-500">学会这些，让你们的感情越来越甜</p>
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-500">暂无文章</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-pink-100"
                onClick={() => router.push(`/blog/${post.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">📖</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-2 text-lg">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                        {post.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            更多攻略持续更新中...
          </p>
        </div>
      </main>
    </div>
  );
}
