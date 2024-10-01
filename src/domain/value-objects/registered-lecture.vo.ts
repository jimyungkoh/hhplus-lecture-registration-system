import { Lecture } from '@prisma/client';

/**
 * 등록된 강의 값 객체를 나타냅니다.
 * @implements {Pick<Lecture, 'id' | 'title' | 'instructor'>}
 */
export class RegisteredLectureVo
  implements Pick<Lecture, 'id' | 'title' | 'instructor'>
{
  /**
   * 새로운 RegisteredLectureVo 인스턴스를 생성합니다.
   * @param {string} id - 강의의 고유 식별자.
   * @param {string} title - 강의 제목.
   * @param {string} instructor - 강의 강사.
   */
  constructor(
    readonly id: string,
    readonly title: string,
    readonly instructor: string,
  ) {}
}
