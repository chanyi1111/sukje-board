import type { TaskCheck } from './TaskCheck'

/** [Repository 패턴] 숙제 진행 기록 저장소의 계약 */
export interface CheckRepository {
  /** 주어진 주기 키들에 해당하는 기록만 조회 */
  listForPeriods(uid: string, characterId: string, periodKeys: string[]): Promise<TaskCheck[]>
  save(uid: string, characterId: string, check: TaskCheck): Promise<void>
}
