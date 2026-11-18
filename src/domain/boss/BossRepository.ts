import type { Boss, NewBoss } from './Boss'

/** [Repository 패턴] 캐릭터별 주간 보스 목록 저장소의 계약 */
export interface BossRepository {
  /** order 오름차순 */
  list(uid: string, characterId: string): Promise<Boss[]>
  add(uid: string, characterId: string, input: NewBoss & { order: number }): Promise<Boss>
  update(uid: string, characterId: string, id: string, changes: NewBoss): Promise<void>
  remove(uid: string, characterId: string, id: string): Promise<void>
  /** 두 보스의 표시 순서를 맞바꾼다 */
  swapOrder(uid: string, characterId: string, a: Boss, b: Boss): Promise<void>
}
