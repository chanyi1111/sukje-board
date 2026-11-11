import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'

import type { Character, NewCharacter } from '@/domain/character/Character'
import type { CharacterRepository } from '@/domain/character/CharacterRepository'
import { FirebaseClient } from '@/infrastructure/firebase/FirebaseClient'
import { fromCharacterDoc, toCharacterDoc } from './characterAdapter'
import { toDataError } from './firestoreErrors'

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
      // TODO: 숙제 체크 기록(하위 컬렉션)이 생기면 함께 삭제하도록 확장
      await deleteDoc(doc(this.collectionOf(uid), id))
    } catch (error) {
      throw toDataError(error)
    }
  }
}
