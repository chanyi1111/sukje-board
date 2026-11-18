import type { TaskDefinition } from '@/domain/game/types'
import { CheckTask, CountTask, GroupTask, Task, ValueTask } from './Task'
import { EMPTY_PROGRESS, type TaskProgress } from './TaskProgress'

export interface TaskFactoryOptions {
  /** 지난 주기라 수정할 수 없는 숙제 */
  locked?: boolean
  /** 묶음(group) 숙제의 하위 숙제들 */
  children?: readonly Task[]
}

/**
 * [Factory 패턴] 숙제 정의 데이터 → 알맞은 숙제 객체
 * - 호출하는 쪽은 CheckTask / CountTask / ValueTask / GroupTask 중 무엇을 만들어야 하는지 몰라도 된다.
 * - 숙제 유형이 늘어나면 이 함수와 새 클래스만 바뀌고, 화면·서비스 코드는 그대로다.
 *   (실제로 #4 에서 group 유형을 추가할 때 이 파일과 Task.ts 만 확장했다)
 */
export const TaskFactory = {
  create(
    definition: TaskDefinition,
    progress: Readonly<TaskProgress> = EMPTY_PROGRESS,
    options: TaskFactoryOptions = {},
  ): Task {
    const locked = options.locked ?? false
    switch (definition.kind) {
      case 'check':
        return new CheckTask(definition, progress, locked)
      case 'count':
        return new CountTask(definition, progress, locked)
      case 'value':
        return new ValueTask(definition, progress, locked)
      case 'group':
        return new GroupTask(definition, options.children ?? [], locked)
    }
  },
}
