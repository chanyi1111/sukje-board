import type { TaskAction } from './TaskProgress'

export type TaskStateName = 'todo' | 'in-progress' | 'done' | 'locked'

/**
 * [State 패턴] 숙제 상태
 * - 상태마다 "어떤 동작을 허용하는지"가 다르다. 이 판단을 if 문 대신 상태 객체에 맡긴다.
 * - Task(Context)는 현재 상태 객체의 guard() 에 판단을 위임한다.
 * - 동작이 적용되면 진행 값이 바뀌고, Task 가 새 진행 값에 맞는 상태로 전이한다.
 *   todo ──(+1/체크)──▶ in-progress ──(최대치 도달)──▶ done
 *   어느 상태든 ──(초기화 시각 지남)──▶ locked
 */
export interface TaskState {
  readonly name: TaskStateName
  readonly label: string
  /** 이 상태에서 action 을 할 수 없으면 이유 메시지, 가능하면 null */
  guard(action: TaskAction): string | null
}

export const TodoState: TaskState = {
  name: 'todo',
  label: '미완료',
  guard(action) {
    if (action.type === 'decrement') return '아직 진행한 횟수가 없습니다.'
    return null
  },
}

export const InProgressState: TaskState = {
  name: 'in-progress',
  label: '진행중',
  guard() {
    return null
  },
}

export const DoneState: TaskState = {
  name: 'done',
  label: '완료',
  guard(action) {
    if (action.type === 'increment') return '이미 최대 횟수를 채웠습니다.'
    return null
  },
}

export const LockedState: TaskState = {
  name: 'locked',
  label: '지난 주기',
  guard() {
    return '초기화 시간이 지나 지난 주기 기록은 수정할 수 없습니다. 새로고침해주세요.'
  },
}
