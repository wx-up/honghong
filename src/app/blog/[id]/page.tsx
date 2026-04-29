'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, Loader2 } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/blog/${id}`);
      const data = await response.json();
      
      if (data.post) {
        setPost(data.post);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('获取文章失败:', err);
      setError(true);
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
    });
  };

  // 将 Markdown 风格的文本转换为 React 组件
  const renderContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        // 处理标题
        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
          return (
            <h3 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">
              {paragraph.replace(/\*\*/g, '')}
            </h3>
          );
        }

        // 处理粗体
        const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={index} className="text-gray-600 leading-relaxed mb-4">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="text-pink-600 font-semibold">
                    {part.replace(/\*\*/g, '')}
                  </strong>
                );
              }

              // 处理列表项（❌ 和 ✅ 开头的）
              if (part.startsWith('❌') || part.startsWith('✅')) {
                const lines = part.split('\n');
                return lines.map((line, j) => {
                  const isError = line.trim().startsWith('❌');
                  const isSuccess = line.trim().startsWith('✅');
                  const text = line.replace(/^[❌✅]\s*/, '');

                  if (isError || isSuccess) {
                    return (
                      <div key={`${i}-${j}`} className={`flex items-start gap-2 mb-2 ${j > 0 ? 'ml-4' : ''}`}>
                        <span className={isError ? 'text-red-500' : 'text-green-500'}>
                          {isError ? '❌' : '✅'}
                        </span>
                        <span className="flex-1">{text}</span>
                      </div>
                    );
                  }
                  return <span key={`${i}-${j}`}>{line}</span>;
                });
              }

              return part;
            })}
          </p>
        );
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">文章不存在</h1>
          <Button onClick={() => router.push('/blog')}>
            返回攻略列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-orange-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/blog')}
            className="p-2 hover:bg-pink-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="text-2xl">📖</div>
            <h1 className="font-bold text-gray-800 truncate">{post.title}</h1>
          </div>
        </div>
      </header>

      {/* 文章内容 */}
      <main className="max-w-2xl mx-auto p-6">
        <Card className="border-pink-100">
          <CardContent className="p-8">
            {/* 标题 */}
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {post.title}
            </h1>

            {/* 元信息 */}
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-gray-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.created_at)}
              </span>
            </div>

            {/* 正文 */}
            <div className="prose prose-pink max-w-none">
              {renderContent(post.content)}
            </div>
          </CardContent>
        </Card>

        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/blog')}
            variant="outline"
            className="border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            返回攻略列表
          </Button>
        </div>
      </main>
    </div>
  );
}
