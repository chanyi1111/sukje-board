import type { TaskDefinition } from '@/domain/game/types'
import { CheckTask, CountTask, Task, ValueTask } from './Task'
import { EMPTY_PROGRESS, type TaskProgress } from './TaskProgress'

/**
 * [Factory 패턴] 숙제 정의 데이터 → 알맞은 숙제 객체
 * - 호출하는 쪽은 CheckTask / CountTask / ValueTask 중 무엇을 만들어야 하는지 몰라도 된다.
 * - 숙제 유형이 늘어나면 이 함수와 새 클래스만 바뀌고, 화면·서비스 코드는 그대로다.
 */
export const TaskFactory = {
  create(
    definition: TaskDefinition,
    progress: Readonly<TaskProgress> = EMPTY_PROGRESS,
    options: { locked?: boolean } = {},
  ): Task {
    const locked = options.locked ?? false
    switch (definition.kind) {
      case 'check':
        return new CheckTask(definition, progress, locked)
      case 'count':
        return new CountTask(definition, progress, locked)
      case 'value':
        return new ValueTask(definition, progress, locked)
    }
  },
}
