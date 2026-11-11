import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * [Singleton 패턴]
 * 앱 전체에서 Firebase 연결(App, Auth, Firestore)을 단 하나만 만들고 공유한다.
 * - 생성자를 private으로 막아 외부에서 new 할 수 없다.
 * - getInstance()가 최초 호출 시에만 인스턴스를 만들고, 이후에는 같은 인스턴스를 돌려준다.
 */
export class FirebaseClient {
  private static instance: FirebaseClient | null = null

  readonly app: FirebaseApp
  readonly auth: Auth
  readonly db: Firestore

  private constructor(options: FirebaseOptions) {
    this.app = initializeApp(options)
    this.auth = getAuth(this.app)
    this.db = getFirestore(this.app)
  }

  static getInstance(): FirebaseClient {
    if (FirebaseClient.instance === null) {
      FirebaseClient.instance = new FirebaseClient(readFirebaseConfig())
    }
    return FirebaseClient.instance
  }
}

/** .env.local 의 VITE_FIREBASE_* 값을 읽고, 빠진 값이 있으면 바로 알려준다. */
function readFirebaseConfig(): FirebaseOptions {
  const env = import.meta.env
  const config: Record<string, string | undefined> = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Firebase 설정값이 없습니다: ${missing.join(', ')} (.env.local 확인)`)
  }

  return config as FirebaseOptions
}
