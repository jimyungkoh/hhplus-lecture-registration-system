import { Registration } from '@prisma/client';

/**
 * 수강 신청 값 객체를 나타냅니다.
 * @implements {Registration}
 */
export class RegistrationVo implements Registration {
  /**
   * 새로운 RegistrationVo 인스턴스를 생성합니다.
   * @param {string} id - 수강 신청의 고유 식별자.
   * @param {string} userId - 수강 신청한 사용자의 고유 식별자.
   * @param {string} lectureId - 수강 신청된 강의의 고유 식별자.
   * @param {Date} createdAt - 수강 신청 생성 일시.
   */
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly lectureId: string,
    readonly createdAt: Date,
  ) {}
}
