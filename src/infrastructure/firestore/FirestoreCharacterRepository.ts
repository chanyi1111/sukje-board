import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

import type { Character, NewCharacter } from '@/domain/character/Character'
import type { CharacterRepository } from '@/domain/character/CharacterRepository'
import { FirebaseClient } from '@/infrastructure/firebase/FirebaseClient'
import { fromCharacterDoc, toCharacterDoc } from './characterAdapter'
import { toDataError } from './firestoreErrors'

const BATCH_LIMIT = 450

/** CharacterRepository 를 Firestore(users/{uid}/characters)로 구현 */
export class FirestoreCharacterRepository implements CharacterRepository {
  constructor(private readonly db: Firestore = FirebaseClient.getInstance().db) {}

  private collectionOf(uid: string) {
    return collection(this.db, 'users', uid, 'characters')
  }

  async list(uid: string): Promise<Character[]> {
    try {
      const snapshot = await getDocs(query(this.collectionOf(uid), orderBy('createdAt', 'asc')))
      return snapshot.docs.map((d) => fromCharacterDoc(d.id, d.data()))
    } catch (error) {
      throw toDataError(error)
    }
  }

  async add(uid: string, input: NewCharacter): Promise<Character> {
    try {
      const data = toCharacterDoc(input, new Date())
      const ref = await addDoc(this.collectionOf(uid), data)
      return { id: ref.id, gameId: input.gameId, name: data.name, createdAt: data.createdAt }
    } catch (error) {
      throw toDataError(error)
    }
  }

  async rename(uid: string, id: string, name: string): Promise<void> {
    try {
      await updateDoc(doc(this.collectionOf(uid), id), { name })
    } catch (error) {
      throw toDataError(error)
    }
  }

  async remove(uid: string, id: string): Promise<void> {
    try {
      // Firestore 는 하위 컬렉션을 자동으로 지우지 않으므로 체크 기록을 먼저 함께 삭제한다
      const characterRef = doc(this.collectionOf(uid), id)
      const checks = await getDocs(collection(characterRef, 'checks'))
      const refs = [...checks.docs.map((d) => d.ref), characterRef]

      // 한 번의 batch 는 최대 500개 → 나눠서 커밋
      for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(this.db)
        refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref))
        await batch.commit()
      }
    } catch (error) {
      throw toDataError(error)
    }
  }
}
