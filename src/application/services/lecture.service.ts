import { Injectable } from '@nestjs/common';
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
   * 특정 userId로 선착순으로 제공되는 특강을 신청하는 API
   *
   * @param userId - 신청하는 사용자의 ID
   * @param lectureId - 신청하려는 특강의 ID
   * @returns {Promise<RegistrationVo>} 신청 결과를 포함한 DTO
   *
   * @description
   * - 동일한 신청자는 동일한 강의에 대해서 한 번의 수강 신청만 성공할 수 있음
   * - 특강은 선착순 30명만 신청 가능
   * - 이미 신청자가 30명이 초과되면 이후 신청자는 요청을 실패함
   */
  async registerForLecture(
    userId: string,
    lectureId: string,
  ): Promise<RegistrationVo> {
    return await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await this.lectureManager.verifyLectureExistence(lectureId, tx);
        await this.registrationManager.checkRegistrationAvailability(
          lectureId,
          userId,
          tx,
        );
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
   * 날짜별로 현재 신청 가능한 특강 목록을 조회하는 API
   *
   * @param dateString - 조회하려는 날짜 (문자열 형식)
   * @returns {Promise<AvailableLectureVo[]>} 해당 날짜에 신청 가능한 특강 목록
   *
   * @description
   * - 특강의 정원은 30명으로 고정
   * - 사용자는 각 특강에 신청하기전 목록을 조회해볼 수 있음
   */
  async findAvailableLectures(
    dateString: string,
  ): Promise<AvailableLectureVo[]> {
    return await this.lectureManager.findAvailableLectures(dateString);
  }

  /**
   * 특정 userId로 신청 완료된 특강 목록을 조회하는 API
   *
   * @param userId - 조회하려는 사용자의 ID
   * @returns {Promise<RegisteredLectureVo[]>} 사용자가 신청한 특강 목록
   *
   * @description
   * - 각 항목은 특강 ID 및 이름, 강연자 정보를 포함
   */
  async getUserRegistrations(userId: string): Promise<RegisteredLectureVo[]> {
    return await this.registrationManager.findRegistrationsBy(userId);
  }
}
