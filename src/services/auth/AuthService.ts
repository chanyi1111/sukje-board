/** 앱 안에서 쓰는 사용자 모델 (Firebase User 타입에 직접 의존하지 않기 위함) */
export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
}

/** 인증 기능의 계약. 화면과 스토어는 이 인터페이스에만 의존한다. */
export interface AuthService {
  signUp(email: string, password: string, displayName: string): Promise<AuthUser>
  signIn(email: string, password: string): Promise<AuthUser>
  signOut(): Promise<void>
  /** 로그인 상태가 바뀔 때마다 listener 호출. 반환값을 호출하면 구독 해제. */
  onChange(listener: (user: AuthUser | null) => void): () => void
}

/** 화면에 그대로 보여줄 수 있는 메시지를 가진 인증 오류 */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
