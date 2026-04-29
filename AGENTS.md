# 哄哄模拟器 · 项目规范

## 项目概述

哄哄模拟器是一个情感排练工具，帮助用户提前演练如何哄生气的人（男女朋友），通过 AI 扮演被哄对象，模拟整个哄人过程。

**核心玩法**：
1. 选择哄的对象（男朋友/女朋友）
2. 选择场景（预设/自定义）
3. 进入哄人界面，通过打字或选择选项与 AI 角色对话
4. AI 判断用户输入是加分还是减分，更新怒气值
5. 怒气值归 0 = 成功，怒气值 ≥ 100 = 失败
6. 支持语音播放（点击触发）和结果分享卡片
7. 博客功能：阅读恋爱技巧文章

---

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI**: LLM (coze-coding-dev-sdk)
- **TTS**: 语音合成 (coze-coding-dev-sdk)

---

## 目录结构

```
├── public/                    # 静态资源
├── scripts/                   # 构建与启动脚本
├── src/
│   ├── app/                   # 页面路由与布局
│   │   ├── page.tsx          # 首页（角色选择）
│   │   ├── login/            # 登录页面
│   │   ├── register/         # 注册页面
│   │   ├── profile/          # 用户个人页面（游戏记录）
│   │   ├── scene/            # 场景选择页面
│   │   ├── chat/             # 哄人对话页面
│   │   ├── result/           # 结果页面
│   │   ├── blog/             # 博客功能
│   │   │   ├── page.tsx      # 博客列表页
│   │   │   └── [id]/page.tsx  # 文章详情页
│   │   └── api/              # API 路由
│   │       ├── auth/         # 认证 API
│   │       │   ├── register/ # 注册
│   │       │   ├── login/    # 登录
│   │       │   └── me/       # 当前用户
│   │       ├── blog/         # 博客 API
│   │       ├── chat/         # 对话 API
│   │       ├── game-records/ # 游戏记录 API
│   │       ├── options/      # 选项 API
│   │       └── tts/          # 语音合成 API
│   ├── components/           # 业务组件
│   ├── hooks/               # 自定义 Hooks
│   ├── lib/                 # 工具库
│   │   ├── AuthContext.tsx  # 认证状态管理
│   │   ├── GameContext.tsx  # 游戏状态管理
│   │   ├── prompts.ts       # AI 提示词模板
│   │   └── types.ts         # 类型定义和声音配置
│   └── storage/             # 数据库
│       └── database/        # Supabase 配置
```
│   └── server/              # API 路由
│       ├── api/chat/        # 对话 API
│       ├── api/options/     # 获取选项 API
│       └── api/tts/         # 语音合成 API
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 游戏流程

1. **首页** → 选择角色（女朋友/男朋友）+ 选择声音（3种预设声音）
2. **场景页** → 选择场景（预设/自定义）
3. **对话页** → 与 AI 对话，哄人
4. **结果页** → 查看成绩和分享

---

## 声音配置

### 女朋友声音选项

| 声音 | 描述 | 适用场景 |
|------|------|----------|
| 御姐 | 成熟稳重，低沉磁性 | 御姐型女友 |
| 太妹 | 活泼俏皮，古灵精怪 | 活泼型女友 |
| 甜妹 | 温柔可爱，声音甜美 | 可爱型女友 |

### 男朋友声音选项

| 声音 | 描述 | 适用场景 |
|------|------|----------|
| 小奶狗 | 温柔体贴，声音治愈 | 温柔型男友 |
| 霸道总裁 | 低沉磁性，气场强大 | 霸道型男友 |
| 都市白领 | 成熟干练，稳重可靠 | 稳重型男友 |

---

## 用户认证

### 数据库表

```sql
CREATE TABLE users (
  id serial PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册（自动登录） |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/me` | GET | 获取当前用户信息 |

### 密码安全

- 使用 bcryptjs 进行密码哈希加密
- 密码不得明文存储
- 登录成功后返回 JWT Token

### 状态管理

- 使用 AuthContext 管理用户登录状态
- Token 存储在 localStorage
- 支持自动登录状态检查

---

## 游戏记录

### 数据库表

```sql
CREATE TABLE game_records (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  scenario varchar(100) NOT NULL,
  final_score integer NOT NULL,
  result varchar(20) NOT NULL CHECK (result IN ('success', 'failure')),
  played_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/game-records` | POST | 保存游戏记录 |
| `/api/game-records/my` | GET | 获取当前用户的游戏记录和统计 |

### 游戏记录保存逻辑

- 已登录用户：游戏结束后自动保存记录
- 未登录用户：弹窗提示"登录后可保存你的游戏记录"
- 统计信息：总场次、胜利次数、胜率

### 状态管理

- 使用 AuthContext 管理用户登录状态
- Token 存储在 localStorage
- 支持自动登录状态检查

---

## 核心类型定义

```typescript
// 角色类型
type Character = 'girlfriend' | 'boyfriend';

// 场景类型
interface Scene {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 对话消息
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 怒气值变化
interface AngerChange {
  delta: number; // 正数增加，负数减少
  reason: string;
}

// 选项
interface Option {
  id: string;
  text: string;
  angerChange: number; // -20 到 +20
}

// 博客文章
interface Article {
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishDate: string;
  readTime: string;
}
```

---

## 预设场景

```typescript
const SCENES = [
  { id: 'forgot-birthday', name: '忘记生日', description: '忘了ta的生日，ta很生气' },
  { id: 'late-date', name: '约会迟到', description: '让ta等了半个小时' },
  { id: 'ignored-messages', name: '忽略消息', description: '连续几天没回消息' },
  { id: 'wrong-word', name: '说错话', description: '不小心说了一句让ta不开心的话' },
  { id: 'broke-promise', name: '食言', description: '答应的事情没有做到' },
  { id: 'work-first', name: '工作优先', description: '因为工作放了他/她鸽子' },
  { id: 'custom', name: '自定义', description: '输入你自己的场景' },
];
```

---

## API 设计

### 1. 对话 API - POST /api/chat

**请求**：
```typescript
{
  character: 'girlfriend' | 'boyfriend';
  scene: string;
  messages: Message[];
  angerValue: number;
}
```

**响应**：
```typescript
{
  response: string;
  angerChange: AngerChange;
  options: Option[];
}
```

### 2. 语音合成 API - POST /api/tts

**请求**：
```typescript
{
  text: string;
  character: 'girlfriend' | 'boyfriend';
  emotion: 'angry' | 'sad' | 'calm' | 'happy';
}
```

**响应**：
```typescript
{
  audioUrl: string;
}
```

### 3. 获取选项 API - POST /api/options

**请求**：
```typescript
{
  character: 'girlfriend' | 'boyfriend';
  scene: string;
  angerValue: number;
  lastMessage: string;
}
```

**响应**：
```typescript
{
  options: Option[];
}
```

---

## 怒气值系统

- **初始值**：50
- **成功条件**：怒气值 ≤ 0
- **失败条件**：怒气值 ≥ 100
- **单次变化范围**：-20 到 +20

**AI 判断标准**：
- 高情商回应：-15 到 -20
- 正常哄：-5 到 -10
- 一般：0 到 -5
- 敷衍/雷区：+5 到 +15
- 踩雷/火上浇油：+15 到 +25

---

## TTS 音色选择

**女朋友角色**：
- 正常：`saturn_zh_female_keainvsheng_tob`（可爱女孩）
- 生气：`zh_female_tiaopigongzhu_tob`（调皮公主）
- 开心：`zh_female_meilinvyou_saturn_bigtts`（魅力女友）

**男朋友角色**：
- 正常：`saturn_zh_male_shuanglangshaonian_tob`（爽朗少年）
- 生气：`zh_male_dayi_saturn_bigtts`（大气男）
- 开心：`zh_male_taocheng_uranus_bigtts`（小成）

---

## 博客文章

```typescript
const articles = [
  {
    slug: 'golden-30-minutes',
    title: '吵架之后的黄金30分钟',
    summary: '吵架不可怕，可怕的是吵完之后不知道怎么办。',
  },
  {
    slug: 'you-are-right',
    title: '为什么"你说得对"是最烂的回复',
    summary: '"你说得对"听起来像认错，实际上是敷衍。',
  },
  {
    slug: 'how-to-apologize',
    title: '道歉的正确打开方式',
    summary: '道歉不是认错就行，道歉是一种能力。',
  },
];
```

---

## 博客功能

博客功能使用 Supabase 数据库驱动，支持 CRUD 操作和 AI 自动生成。

### 数据库表

```sql
CREATE TABLE blog_posts (
  id serial PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/blog` | GET | 获取文章列表 |
| `/api/blog/[id]` | GET | 获取单篇文章 |
| `/api/blog/generate` | POST | AI 生成文章 |

### 文章生成

支持通过 AI 自动生成恋爱沟通技巧文章：
- 用户输入主题
- AI 生成标题、摘要、正文
- 保存到数据库

### 页面路由

- `/blog` - 博客列表页
- `/blog/[id]` - 文章详情页（使用数字 ID）

---

## 技能使用说明

### LLM Skill
- **位置**：/skills/public/prod/llm
- **用途**：AI 对话生成、怒气值判断、选项生成
- **模型**：使用 doubao-seed-1-8-251228
- **注意**：仅在服务端使用，API 路由位于 `src/app/api/`

### Audio Skill
- **位置**：/skills/public/prod/audio
- **用途**：文字转语音，点击播放
- **注意**：仅在服务端使用，TTS API 位于 `src/app/api/tts/route.ts`

---

## 开发规范

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 `typeof window`、`Date.now()`、`Math.random()` 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**
2. 严禁非法 HTML 嵌套（如 `<p>` 嵌套 `<div>`）
3. **Next.js 16 动态路由参数**：动态路由 `[slug]` 的 params 是 Promise，必须使用 `use(params)` 解析

### AI 流式输出

哄人对话必须使用流式输出（SSE），打字机式显示 AI 回复：
- 后端：使用 `stream()` 方法
- 前端：使用 `fetch` + `body.getReader()` 逐步读取

### 状态管理

- 使用 React Context 管理全局状态（角色选择、当前场景）
- 使用 `useState` + `useReducer` 管理对话状态

---

## 包管理规范

**仅允许使用 pnpm** 作为包管理器
- 安装依赖：`pnpm add <package>`
- 安装所有依赖：`pnpm install`

---

## UI 设计与组件规范

- 默认采用 shadcn/ui 组件
- 使用 Tailwind CSS 4 样式
- 颜色主题：温暖、柔和的色调（粉色、暖橙色为主）

---

## 构建与测试

```bash
# 类型检查
pnpm ts-check

# 开发环境
pnpm dev

# 生产构建
pnpm build
```
