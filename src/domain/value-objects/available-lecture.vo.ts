import { Lecture } from '@prisma/client';

/**
 * 사용 가능한 슬롯이 있는 강의를 나타내는 클래스
 * @implements {Omit<Lecture, 'createdAt' | 'updatedAt'>}
 */
export class AvailableLectureVo
  implements Omit<Lecture, 'hostId' | 'createdAt' | 'updatedAt'>
{
  /**
   * AvailableLectureVo 클래스의 생성자
   * @param {string} id - 강의의 고유 식별자
   * @param {string} title - 강의 제목
   * @param {string} instructor - 강사 이름
   * @param {Date} date - 강의 날짜
   * @param {number} capacity - 강의 최대 수용 인원
   * @param {number} currentRegistrations - 현재 등록된 수강생 수
   */
  constructor(
    readonly id: string,
    readonly title: string,
    readonly instructor: string,
    readonly date: Date,
    readonly capacity: number,
    readonly currentRegistrations: number,
  ) {}
}
