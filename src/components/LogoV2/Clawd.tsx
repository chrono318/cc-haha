import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { env } from '../../utils/env.js';

export type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';

type Props = {
  pose?: ClawdPose;
};

// 八卦字符 (先天八卦序): ☰乾 ☱兑 ☲离 ☳震 ☴巽 ☵坎 ☶艮 ☷坤
// 排成 3 行环绕中心太极 ☯。
const BAGUA_ROWS = ['☰   ☱   ☲', '☴   ☯   ☵', '☶   ☷   ☰'];

// 不同 pose 下中心太极的微调 (look-* 微移,arms-up 加光晕),保持简单。
const CENTER_BY_POSE: Record<ClawdPose, string> = {
  default: '☯',
  'arms-up': '✦',
  'look-left': '☯',
  'look-right': '☯',
};

export function Clawd({ pose = 'default' }: Props = {}): React.ReactNode {
  if (env.terminal === 'Apple_Terminal') {
    // Apple Terminal 对 block 字符渲染差,退化为纯太极符号
    return (
      <Box flexDirection="column" alignItems="center">
        <Text color="clawd_body">☯</Text>
      </Box>
    );
  }
  const center = CENTER_BY_POSE[pose];
  return (
    <Box flexDirection="column" alignItems="center">
      <Text color="clawd_body">{BAGUA_ROWS[0]}</Text>
      <Text color="clawd_body">
        {BAGUA_ROWS[1].replace('☯', center)}
      </Text>
      <Text color="clawd_body">{BAGUA_ROWS[2]}</Text>
    </Box>
  );
}
