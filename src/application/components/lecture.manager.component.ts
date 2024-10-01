import { Injectable } from '@nestjs/common';
import { Lecture, Prisma } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { LectureNotFoundException } from '../exceptions';
import { AvailableLectureVo } from 'src/domain/value-objects';

@Injectable()
export class LectureManager {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 강의 존재 여부 확인
   * @param {string} lectureId - 강의 ID
   * @param {Prisma.TransactionClient} [tx] - 트랜잭션 클라이언트 (선택사항)
   * @throws {LectureNotFoundException} 강의를 찾을 수 없는 경우
   * @returns {Promise<void>}
   */
  async verifyLectureExistence(
    lectureId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    const lecture = await client.lecture.findUnique({
      where: { id: lectureId },
    });

    if (!lecture) {
      throw new LectureNotFoundException(
        `[강의 ID]: ${lectureId}에 해당하는 강의를 찾을 수 없습니다`,
      );
    }
  }

  /**
   * 사용 가능한 강의 조회
   * 사용 가능한 강의: 현재 등록 인원이 수용 인원보다 적은 강의
   * @param {string} dateString - 날짜 문자열 (YYYY-MM-DD 형식)
   * @returns {Promise<AvailableLectureVo[]>} 사용 가능한 강의 목록
   */
  async findAvailableLectures(
    dateString: string,
  ): Promise<AvailableLectureVo[]> {
    const { startOfDate, endOfDate } = this.getDateRange(dateString);
    const lectures = await this.findLectures(startOfDate, endOfDate);

    return lectures
      .filter((lecture) => lecture.capacity > lecture.currentRegistrations)
      .map(
        (lecture) =>
          new AvailableLectureVo(
            lecture.id,
            lecture.title,
            lecture.instructor,
            lecture.date,
            lecture.capacity,
            lecture.currentRegistrations,
          ),
      );
  }

  /**
   * 특정 기간 내 강의를 신청 수와 함께 조회
   * @param {Date} startOfDate - 시작 날짜
   * @param {Date} endOfDate - 종료 날짜
   * @returns {Promise<Lecture[]>} 강의 목록
   * @private
   */
  private async findLectures(
    startOfDate: Date,
    endOfDate: Date,
  ): Promise<Lecture[]> {
    return this.prisma.lecture.findMany({
      where: {
        date: {
          gte: startOfDate,
          lt: endOfDate,
        },
      },
    });
  }

  /**
   * 날짜 범위 계산
   * @param {string} dateString - 날짜 문자열 (YYYY-MM-DD 형식)
   * @returns {{ startOfDate: Date; endOfDate: Date }} 시작 날짜와 종료 날짜
   * @private
   */
  private getDateRange(dateString: string): {
    startOfDate: Date;
    endOfDate: Date;
  } {
    const date = new Date(dateString);

    return {
      startOfDate: new Date(date.setHours(0, 0, 0, 0)),
      endOfDate: new Date(date.setHours(23, 59, 59, 999)),
    };
  }
}
