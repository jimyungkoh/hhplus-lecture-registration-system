import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  LectureFullException,
  UserAlreadyRegisteredException,
  LectureNotFoundException,
} from '../exceptions';
import { RegisteredLectureVo, RegistrationVo } from 'src/domain/value-objects';

@Injectable()
export class RegistrationManager {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 강의 등록 가능 여부 확인
   * @param {string} lectureId - 강의 ID
   * @param {string} userId - 사용자 ID
   * @param {Prisma.TransactionClient} [tx] - 트랜잭션 클라이언트 (선택사항)
   * @throws {ConflictException} 강의가 꽉 찼거나 사용자가 이미 등록된 경우
   * @returns {Promise<void>}
   */
  async checkRegistrationAvailability(
    lectureId: string,
    userId: string,
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

    if (lecture.currentRegistrations >= lecture.capacity) {
      throw new LectureFullException(
        `[강의 ID]: ${lectureId}의 정원이 꽉 찼습니다`,
      );
    }

    const existingRegistration = await client.registration.findUnique({
      where: {
        userId_lectureId: {
          userId,
          lectureId,
        },
      },
    });

    if (existingRegistration)
      throw new UserAlreadyRegisteredException(
        `[사용자 ID]: ${userId}는 이미 [강의 ID]: ${lectureId}에 등록되어 있습니다`,
      );
  }

  /**
   * 강의 등록
   * @param {string} userId - 사용자 ID
   * @param {string} lectureId - 강의 ID
   * @param {Prisma.TransactionClient} [tx] - 트랜잭션 클라이언트 (선택사항)
   * @returns {Promise<RegistrationVo>} 생성된 등록 정보
   */
  async register(
    userId: string,
    lectureId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RegistrationVo> {
    const client = tx ?? this.prisma;

    const [_, registration] = await Promise.all([
      client.lecture.update({
        where: { id: lectureId },
        data: { currentRegistrations: { increment: 1 } },
      }),
      client.registration.create({
        data: { userId, lectureId },
      }),
    ]);

    return registration;
  }

  /**
   * 사용자의 등록된 강의 조회
   * @param {string} userId - 사용자 ID
   * @param {Prisma.TransactionClient} [transaction] - 트랜잭션 클라이언트 (선택사항)
   * @returns {Promise<RegisteredLectureVo[]>} 등록된 강의 목록
   */
  async findRegistrationsBy(
    userId: string,
    transaction?: Prisma.TransactionClient,
  ): Promise<RegisteredLectureVo[]> {
    const client = transaction ?? this.prisma;

    const registrations = await client.registration.findMany({
      where: { userId },
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            instructor: true,
          },
        },
      },
    });

    return registrations.map(
      (registration) =>
        new RegisteredLectureVo(
          registration.lecture.id,
          registration.lecture.title,
          registration.lecture.instructor,
        ),
    );
  }
}
