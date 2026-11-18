import type { GameDefinition, GameId } from './types'

/**
 * 게임 정의 데이터
 * 엔진(체크·초기화·집계)은 게임과 무관하게 동작하고, 게임별 차이는 이 데이터로만 표현한다.
 */

const MAPLESTORY: GameDefinition = {
  id: 'maplestory',
  name: '메이플스토리',
  tasks: [
    {
      id: 'weekly-boss',
      name: '주간 보스',
      kind: 'group', // 사용자가 등록한 보스 목록이 하위 숙제가 된다 (Composite)
      reset: { type: 'weekly', dayOfWeek: 4, hour: 0 }, // 목요일 00:00
    },
    {
      id: 'underground-waterway',
      name: '지하 수로',
      kind: 'value',
      reset: { type: 'weekly', dayOfWeek: 4, hour: 0 }, // 목요일 00:00
    },
    {
      id: 'epic-dungeon',
      name: '에픽 던전',
      kind: 'check',
      reset: { type: 'weekly', dayOfWeek: 4, hour: 0 }, // 목요일 00:00
    },
  ],
}

const TRICKCAL_DAILY = { type: 'daily', hour: 4 } as const // 매일 04:00
const TRICKCAL_WEEKLY = { type: 'weekly', dayOfWeek: 1, hour: 4 } as const // 매주 월요일 04:00

const TRICKCAL: GameDefinition = {
  id: 'trickcal',
  name: '트릭컬 리바이브',
  tasks: [
    { id: 'theme-dungeon', name: '테마던전', kind: 'count', max: 20, reset: TRICKCAL_DAILY },
    { id: 'big-candy', name: '왕사탕 10충 (장비)', kind: 'count', max: 10, reset: TRICKCAL_DAILY },
    { id: 'star-candy', name: '별사탕 풀충 던전', kind: 'check', reset: TRICKCAL_DAILY },
    { id: 'nururing-busters', name: '누루링 버스터즈', kind: 'check', reset: TRICKCAL_DAILY },
    { id: 'pvp', name: '줘팸터 (PvP)', kind: 'check', reset: TRICKCAL_DAILY },
    { id: 'short-attribute-class', name: '단기 속성반', kind: 'check', reset: TRICKCAL_DAILY },
    { id: 'restaurant', name: '연회장 식사', kind: 'check', reset: TRICKCAL_DAILY },
    { id: 'daily-farm', name: '평일농장 수확', kind: 'check', reset: TRICKCAL_DAILY },
    { id: 'schedule', name: '스케줄 보내기', kind: 'check', reset: TRICKCAL_DAILY },
    // 밑에 부턴 주간퀘 목록
    { id: 'login-3', name: '일일 접속 3회', kind: 'count', max: 3, reset: TRICKCAL_WEEKLY },
    { id: 'candyreceive-5', name: '성물 수령 5회', kind: 'count', max: 5, reset: TRICKCAL_WEEKLY },
    { id: 'shop-12', name: '상점이용 12회', kind: 'count', max: 12, reset: TRICKCAL_WEEKLY },
    { id: 'bigcandy-1000', name: '왕사탕 1000개 소모', kind: 'check', reset: TRICKCAL_WEEKLY },
    { id: 'starcandy-500', name: '별사탕 500개 소모', kind: 'check', reset: TRICKCAL_WEEKLY },
    { id: 'schedule-10', name: '스케줄 보내기 10회', kind: 'count', max: 10, reset: TRICKCAL_WEEKLY },
    { id: 'random-1', name: '랜덤 숙제 1', kind: 'check', reset: TRICKCAL_WEEKLY },
    { id: 'random-2', name: '랜덤 숙제 2', kind: 'check', reset: TRICKCAL_WEEKLY },
    { id: 'random-3', name: '랜덤 숙제 3', kind: 'check', reset: TRICKCAL_WEEKLY },
  ],
}

export const GAMES: readonly GameDefinition[] = [MAPLESTORY, TRICKCAL]

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && GAMES.some((game) => game.id === value)
}

export function getGame(id: GameId): GameDefinition {
  const game = GAMES.find((g) => g.id === id)
  if (!game) throw new Error(`알 수 없는 게임입니다: ${id}`)
  return game
}
