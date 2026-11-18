import type { TaskDefinition } from '@/domain/game/types'

export type BossDifficulty = 'easy' | 'normal' | 'hard' | 'chaos' | 'extreme'

export const BOSS_DIFFICULTIES: readonly { id: BossDifficulty; label: string }[] = [
  { id: 'easy', label: '이지' },
  { id: 'normal', label: '노멀' },
  { id: 'hard', label: '하드' },
  { id: 'chaos', label: '카오스' },
  { id: 'extreme', label: '익스트림' },
]

export function difficultyLabel(difficulty: BossDifficulty): string {
  return BOSS_DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? difficulty
}

export function isBossDifficulty(value: unknown): value is BossDifficulty {
  return typeof value === 'string' && BOSS_DIFFICULTIES.some((d) => d.id === value)
}

/** 사용자가 캐릭터에 등록한 주간 보스 */
export interface Boss {
  id: string
  name: string
  difficulty: BossDifficulty
  /** 화면 표시 순서 (작을수록 위) */
  order: number
  createdAt: Date
}

export interface NewBoss {
  name: string
  difficulty: BossDifficulty
}

/** 게임 규칙: 캐릭터당 주간 보스는 12개까지 */
export const MAX_BOSSES_PER_CHARACTER = 12
export const BOSS_NAME_MAX_LENGTH = 20

/** 보스 규칙 위반 (저장 요청 전에 걸러짐) */
export class BossRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BossRuleError'
  }
}

export function normalizeBossName(name: string): string {
  return name.trim()
}

export function validateBossName(name: string): string | null {
  const value = normalizeBossName(name)
  if (value === '') return '보스 이름을 입력해주세요.'
  if (value.length > BOSS_NAME_MAX_LENGTH) {
    return `보스 이름은 ${BOSS_NAME_MAX_LENGTH}자 이하로 입력해주세요.`
  }
  return null
}

/**
 * 서비스 규칙: 같은 보스는 하나의 난이도로만 등록한다.
 * (주간 보스는 난이도와 관계없이 보스당 주 1회만 보상을 받기 때문)
 */
export function isDuplicateBossName(
  bosses: readonly Boss[],
  name: string,
  excludeId?: string,
): boolean {
  const target = normalizeBossName(name).toLowerCase()
  return bosses.some((b) => b.id !== excludeId && b.name.toLowerCase() === target)
}

export function canAddBoss(bosses: readonly Boss[]): boolean {
  return bosses.length < MAX_BOSSES_PER_CHARACTER
}

/** 보스 → 체크 기록에 쓸 하위 숙제 id */
export function bossTaskId(bossId: string): string {
  return `boss-${bossId}`
}

/** 보스 하나를 묶음 숙제(부모)의 초기화 규칙을 따르는 체크형 하위 숙제로 변환 */
export function bossToTaskDefinition(boss: Boss, parent: TaskDefinition): TaskDefinition {
  return {
    id: bossTaskId(boss.id),
    name: `${difficultyLabel(boss.difficulty)} ${boss.name}`,
    kind: 'check',
    reset: parent.reset,
  }
}
