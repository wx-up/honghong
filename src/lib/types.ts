// 角色类型
export type Character = 'girlfriend' | 'boyfriend';

// 声音类型
export type GirlfriendVoice = 'yujie' | 'taimei' | 'tianmei';
export type BoyfriendVoice = 'xiaonaigou' | 'badao' | 'bailing';

export type Voice = GirlfriendVoice | BoyfriendVoice;

// 声音配置
export interface VoiceOption {
  id: Voice;
  name: string;
  description: string;
  emoji: string;
  speaker: string;
  angrySpeaker: string;
  happySpeaker: string;
}

// 女朋友声音选项（使用文档确认的可用声音）
export const GIRLFRIEND_VOICES: VoiceOption[] = [
  {
    id: 'yujie',
    name: '御姐',
    description: '成熟稳重，低沉磁性',
    emoji: '👩‍💼',
    speaker: 'zh_female_meilinvyou_saturn_bigtts',
    angrySpeaker: 'zh_female_meilinvyou_saturn_bigtts',
    happySpeaker: 'zh_female_meilinvyou_saturn_bigtts',
  },
  {
    id: 'taimei',
    name: '太妹',
    description: '活泼俏皮，古灵精怪',
    emoji: '💃',
    speaker: 'zh_female_xiaohe_uranus_bigtts',
    angrySpeaker: 'zh_female_xiaohe_uranus_bigtts',
    happySpeaker: 'zh_female_xiaohe_uranus_bigtts',
  },
  {
    id: 'tianmei',
    name: '甜妹',
    description: '温柔可爱，声音甜美',
    emoji: '🍬',
    speaker: 'saturn_zh_female_keainvsheng_tob',
    angrySpeaker: 'saturn_zh_female_keainvsheng_tob',
    happySpeaker: 'saturn_zh_female_keainvsheng_tob',
  },
];

// 男朋友声音选项
export const BOYFRIEND_VOICES: VoiceOption[] = [
  {
    id: 'xiaonaigou',
    name: '小奶狗',
    description: '温柔体贴，声音治愈',
    emoji: '🐶',
    speaker: 'zh_male_taocheng_uranus_bigtts',
    angrySpeaker: 'zh_male_taocheng_uranus_bigtts',
    happySpeaker: 'zh_male_taocheng_uranus_bigtts',
  },
  {
    id: 'badao',
    name: '霸道总裁',
    description: '低沉磁性，气场强大',
    emoji: '👔',
    speaker: 'zh_male_dayi_saturn_bigtts',
    angrySpeaker: 'zh_male_dayi_saturn_bigtts',
    happySpeaker: 'zh_male_dayi_saturn_bigtts',
  },
  {
    id: 'bailing',
    name: '都市白领',
    description: '成熟干练，稳重可靠',
    emoji: '💼',
    speaker: 'saturn_zh_male_shuanglangshaonian_tob',
    angrySpeaker: 'saturn_zh_male_shuanglangshaonian_tob',
    happySpeaker: 'saturn_zh_male_shuanglangshaonian_tob',
  },
];

// 获取声音配置
export function getVoiceConfig(character: Character, voiceId: Voice): VoiceOption {
  if (character === 'girlfriend') {
    return GIRLFRIEND_VOICES.find(v => v.id === voiceId) || GIRLFRIEND_VOICES[2];
  }
  return BOYFRIEND_VOICES.find(v => v.id === voiceId) || BOYFRIEND_VOICES[2];
}

// 场景类型
export interface Scene {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 对话消息
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 怒气值变化
export interface AngerChange {
  delta: number;
  reason: string;
}

// 选项
export interface Option {
  id: string;
  text: string;
  angerChange: number;
}

// 游戏状态
export interface GameState {
  character: Character | null;
  voice: Voice | null;
  scene: Scene | null;
  customScene: string | null;
  angerValue: number;
  messages: Message[];
  isPlaying: boolean;
  isSuccess: boolean | null;
}

// 预设场景
export const PRESET_SCENES: Scene[] = [
  { id: 'forgot-birthday', name: '忘记生日', description: '忘了ta的生日，ta很生气', icon: '🎂' },
  { id: 'late-date', name: '约会迟到', description: '让ta等了半个小时', icon: '⏰' },
  { id: 'ignored-messages', name: '忽略消息', description: '连续几天没回消息', icon: '📱' },
  { id: 'wrong-word', name: '说错话', description: '不小心说了一句让ta不开心的话', icon: '💔' },
  { id: 'broke-promise', name: '食言', description: '答应的事情没有做到', icon: '🤥' },
  { id: 'work-first', name: '工作优先', description: '因为工作放了他/她鸽子', icon: '💼' },
];

// 角色配置
export const CHARACTER_CONFIG = {
  girlfriend: {
    name: '女朋友',
    emoji: '👩',
    ttsSpeaker: 'saturn_zh_female_keainvsheng_tob',
    angrySpeaker: 'zh_female_tiaopigongzhu_tob',
    happySpeaker: 'zh_female_meilinvyou_saturn_bigtts',
  },
  boyfriend: {
    name: '男朋友',
    emoji: '👨',
    ttsSpeaker: 'saturn_zh_male_shuanglangshaonian_tob',
    angrySpeaker: 'zh_male_dayi_saturn_bigtts',
    happySpeaker: 'zh_male_taocheng_uranus_bigtts',
  },
};
