import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth'

import { FirebaseClient } from '@/infrastructure/firebase/FirebaseClient'
import type { AuthService, AuthUser } from './AuthService'
import { toAuthError } from './authErrors'

/** Firebase User → 앱의 AuthUser 로 변환 */
function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName }
}

/** AuthService 계약을 Firebase Authentication 으로 구현 */
export class FirebaseAuthService implements AuthService {
  constructor(private readonly auth: Auth = FirebaseClient.getInstance().auth) {}

  async signUp(email: string, password: string, displayName: string): Promise<AuthUser> {
    try {
      const { user } = await createUserWithEmailAndPassword(this.auth, email.trim(), password)
      await updateProfile(user, { displayName: displayName.trim() })
      return toAuthUser(user)
    } catch (error) {
      throw toAuthError(error)
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const { user } = await signInWithEmailAndPassword(this.auth, email.trim(), password)
      return toAuthUser(user)
    } catch (error) {
      throw toAuthError(error)
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth)
    } catch (error) {
      throw toAuthError(error)
    }
  }

  onChange(listener: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => listener(user ? toAuthUser(user) : null))
  }
}
