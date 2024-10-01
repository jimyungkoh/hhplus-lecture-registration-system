import { Lecture } from '@prisma/client';

/**
 * 강의 값 객체를 나타냅니다.
 * @implements {Lecture}
 */
export class LectureVo implements Lecture {
  /**
   * 새로운 LectureVo 인스턴스를 생성합니다.
   * @param {string} id - 강의의 고유 식별자.
   * @param {string} title - 강의 제목.
   * @param {string} instructor - 강사 이름.
   * @param {Date} date - 강의 날짜.
   * @param {number} capacity - 수강 정원.
   * @param {number} currentRegistrations - 현재 등록된 수강생 수.
   * @param {string} hostId - 주최자 ID.
   * @param {Date} createdAt - 강의 생성 일시.
   * @param {Date} updatedAt - 강의 수정 일시.
   */
  constructor(
    readonly id: string,
    readonly title: string,
    readonly instructor: string,
    readonly date: Date,
    readonly capacity: number,
    readonly currentRegistrations: number,
    readonly hostId: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
