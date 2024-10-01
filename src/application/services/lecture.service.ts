import { Injectable, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { LectureManager, RegistrationManager } from '../components';
import {
  AvailableLectureVo,
  RegisteredLectureVo,
  RegistrationVo,
} from 'src/domain/value-objects';

@Injectable()
export class LectureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lectureManager: LectureManager,
    private readonly registrationManager: RegistrationManager,
  ) {}

  /**
   * 특정 userId로 특강 신청
   *
   * @param {string} userId - 신청하는 사용자의 고유 식별자
   * @param {string} lectureId - 신청하려는 특강의 고유 식별자
   * @returns {Promise<RegistrationVo>} 신청 결과를 포함한 DTO
   */
  async registerForLecture(
    userId: string,
    lectureId: string,
  ): Promise<RegistrationVo> {
    return await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await Promise.all([
          this.lectureManager.verifyLectureExistence(lectureId, tx),
          this.registrationManager.checkRegistrationAvailability(
            lectureId,
            userId,
            tx,
          ),
        ]);

        return await this.registrationManager.register(userId, lectureId, tx);
      },
      {
        maxWait: 4_000,
        timeout: 6_000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * 날짜별로 현재 신청 가능한 특강 목록을 조회
   *
   * @param {string} dateString - 조회하려는 날짜 (YYYY-MM-DD 형식)
   * @returns {Promise<AvailableLectureVo[]>} 해당 날짜에 신청 가능한 특강 목록
   */
  async findAvailableLectures(
    dateString: string,
  ): Promise<AvailableLectureVo[]> {
    return await this.lectureManager.findAvailableLectures(dateString);
  }

  /**
   * 특정 userId로 신청 완료된 특강 목록 조회
   *
   * @param {string} userId - 조회하려는 사용자의 고유 식별자
   * @returns {Promise<RegisteredLectureVo[]>} 사용자가 신청한 특강 목록
   */
  async getUserRegistrations(userId: string): Promise<RegisteredLectureVo[]> {
    return await this.registrationManager.findRegistrationsBy(userId);
  }
}
