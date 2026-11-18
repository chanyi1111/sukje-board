import {
  BossRuleError,
  canAddBoss,
  isDuplicateBossName,
  MAX_BOSSES_PER_CHARACTER,
  normalizeBossName,
  validateBossName,
  type Boss,
  type NewBoss,
} from '@/domain/boss/Boss'
import type { BossRepository } from '@/domain/boss/BossRepository'

export const DUPLICATE_BOSS_MESSAGE = '이미 등록된 보스입니다. 같은 보스는 하나의 난이도로만 등록할 수 있어요.'
export const BOSS_LIMIT_MESSAGE = `주간 보스는 캐릭터당 ${MAX_BOSSES_PER_CHARACTER}개까지 등록할 수 있습니다.`

/**
 * 주간 보스 목록 처리 규칙 계층
 * 화면 → (이 서비스: 이름 검사·중복·12개 제한·순서) → BossRepository(저장)
 */
export class BossService {
  constructor(private readonly repository: BossRepository) {}

  list(uid: string, characterId: string): Promise<Boss[]> {
    return this.repository.list(uid, characterId)
  }

  async add(uid: string, characterId: string, existing: readonly Boss[], input: NewBoss): Promise<Boss> {
    const name = normalizeBossName(input.name)
    if (!canAddBoss(existing)) throw new BossRuleError(BOSS_LIMIT_MESSAGE)
    this.assertValidName(existing, name)

    const order = existing.reduce((max, b) => Math.max(max, b.order), -1) + 1
    return this.repository.add(uid, characterId, { name, difficulty: input.difficulty, order })
  }

  async update(
    uid: string,
    characterId: string,
    existing: readonly Boss[],
    target: Boss,
    input: NewBoss,
  ): Promise<Boss> {
    const name = normalizeBossName(input.name)
    this.assertValidName(existing, name, target.id)
    await this.repository.update(uid, characterId, target.id, { name, difficulty: input.difficulty })
    return { ...target, name, difficulty: input.difficulty }
  }

  remove(uid: string, characterId: string, id: string): Promise<void> {
    return this.repository.remove(uid, characterId, id)
  }

  /** 보스를 한 칸 위/아래로 이동. 맨 위/아래라 움직일 수 없으면 false */
  async move(
    uid: string,
    characterId: string,
    existing: readonly Boss[],
    id: string,
    direction: 'up' | 'down',
  ): Promise<boolean> {
    const sorted = [...existing].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((b) => b.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const current = sorted[index]
    const other = sorted[swapIndex]
    if (index < 0 || !current || !other) return false

    await this.repository.swapOrder(uid, characterId, current, other)
    return true
  }

  private assertValidName(existing: readonly Boss[], name: string, excludeId?: string): void {
    const message = validateBossName(name)
    if (message) throw new BossRuleError(message)
    if (isDuplicateBossName(existing, name, excludeId)) throw new BossRuleError(DUPLICATE_BOSS_MESSAGE)
  }
}
