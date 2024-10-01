import { User } from '@prisma/client';

/**
 * 사용자 값 객체를 나타냅니다.
 * @implements {User}
 */
export class UserVo implements User {
  /**
   * 새로운 UserVo 인스턴스를 생성합니다.
   * @param {string} name - 사용자의 이름.
   * @param {string} id - 사용자의 고유 식별자.
   * @param {string} email - 사용자의 이메일 주소.
   * @param {Date} createdAt - 사용자 계정 생성 일시.
   * @param {Date} updatedAt - 사용자 정보 최종 수정 일시.
   */
  constructor(
    readonly name: string,
    readonly id: string,
    readonly email: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
