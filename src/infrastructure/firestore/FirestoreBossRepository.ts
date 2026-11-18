import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

import type { Boss, NewBoss } from '@/domain/boss/Boss'
import type { BossRepository } from '@/domain/boss/BossRepository'
import { FirebaseClient } from '@/infrastructure/firebase/FirebaseClient'
import { fromBossDoc, toBossDoc } from './bossAdapter'
import { toDataError } from './firestoreErrors'

/** BossRepository 를 Firestore(users/{uid}/characters/{characterId}/bosses)로 구현 */
export class FirestoreBossRepository implements BossRepository {
  constructor(private readonly db: Firestore = FirebaseClient.getInstance().db) {}

  private collectionOf(uid: string, characterId: string) {
    return collection(this.db, 'users', uid, 'characters', characterId, 'bosses')
  }

  async list(uid: string, characterId: string): Promise<Boss[]> {
    try {
      const snapshot = await getDocs(query(this.collectionOf(uid, characterId), orderBy('order', 'asc')))
      return snapshot.docs.map((d) => fromBossDoc(d.id, d.data()))
    } catch (error) {
      throw toDataError(error)
    }
  }

  async add(uid: string, characterId: string, input: NewBoss & { order: number }): Promise<Boss> {
    try {
      const data = toBossDoc(input, new Date())
      const ref = await addDoc(this.collectionOf(uid, characterId), data)
      return { id: ref.id, ...input, createdAt: data.createdAt }
    } catch (error) {
      throw toDataError(error)
    }
  }

  async update(uid: string, characterId: string, id: string, changes: NewBoss): Promise<void> {
    try {
      await updateDoc(doc(this.collectionOf(uid, characterId), id), {
        name: changes.name,
        difficulty: changes.difficulty,
      })
    } catch (error) {
      throw toDataError(error)
    }
  }

  async remove(uid: string, characterId: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.collectionOf(uid, characterId), id))
    } catch (error) {
      throw toDataError(error)
    }
  }

  async swapOrder(uid: string, characterId: string, a: Boss, b: Boss): Promise<void> {
    try {
      // 두 문서를 한 번에 바꿔야 순서가 꼬이지 않는다 → batch
      const batch = writeBatch(this.db)
      batch.update(doc(this.collectionOf(uid, characterId), a.id), { order: b.order })
      batch.update(doc(this.collectionOf(uid, characterId), b.id), { order: a.order })
      await batch.commit()
    } catch (error) {
      throw toDataError(error)
    }
  }
}
