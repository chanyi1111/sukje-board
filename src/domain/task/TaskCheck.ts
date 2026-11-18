import type { TaskProgress } from './TaskProgress'

/** Firestore 에 저장되는 "어떤 주기의 어떤 숙제" 진행 기록 */
export interface TaskCheck extends TaskProgress {
  taskId: string
  periodKey: string
  updatedAt: Date
}

/** 문서 id: 주기 + 숙제 → 같은 주기·숙제의 기록은 항상 하나 */
export function checkDocId(periodKey: string, taskId: string): string {
  return `${periodKey}_${taskId}`
}
