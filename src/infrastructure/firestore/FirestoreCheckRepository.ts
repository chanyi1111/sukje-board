import { collection, doc, getDocs, query, setDoc, where, type Firestore } from 'firebase/firestore'

import type { CheckRepository } from '@/domain/task/CheckRepository'
import { checkDocId, type TaskCheck } from '@/domain/task/TaskCheck'
import { FirebaseClient } from '@/infrastructure/firebase/FirebaseClient'
import { fromCheckDoc, toCheckDoc } from './checkAdapter'
import { toDataError } from './firestoreErrors'

/** CheckRepository 를 Firestore(users/{uid}/characters/{characterId}/checks)로 구현 */
export class FirestoreCheckRepository implements CheckRepository {
  constructor(private readonly db: Firestore = FirebaseClient.getInstance().db) {}

  private collectionOf(uid: string, characterId: string) {
    return collection(this.db, 'users', uid, 'characters', characterId, 'checks')
  }

  async listForPeriods(uid: string, characterId: string, periodKeys: string[]): Promise<TaskCheck[]> {
    if (periodKeys.length === 0) return []
    try {
      // 'in' 조건은 최대 30개까지 가능 — 숙제 주기 종류는 몇 개뿐이라 충분하다
      const q = query(this.collectionOf(uid, characterId), where('periodKey', 'in', periodKeys))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => fromCheckDoc(d.data()))
    } catch (error) {
      throw toDataError(error)
    }
  }

  async save(uid: string, characterId: string, check: TaskCheck): Promise<void> {
    try {
      const ref = doc(this.collectionOf(uid, characterId), checkDocId(check.periodKey, check.taskId))
      await setDoc(ref, toCheckDoc(check))
    } catch (error) {
      throw toDataError(error)
    }
  }
}
