import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationManager } from 'src/application/components';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  LectureFullException,
  UserAlreadyRegisteredException,
} from 'src/application/exceptions';
import { RegisteredLectureVo, LectureVo } from 'src/domain/value-objects';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('RegistrationManager', () => {
  let registrationManager: RegistrationManager;
  let prismaService: DeepMockProxy<PrismaService>;

  /**
   * 각 테스트 전에 실행되는 설정
   * 테스트에 필요한 RegistrationManager 인스턴스와 PrismaService Mock 객체를 생성합니다.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationManager,
        { provide: PrismaService, useFactory: mockDeep<PrismaService> },
      ],
    }).compile();

    registrationManager = module.get<RegistrationManager>(RegistrationManager);
    prismaService = module.get(PrismaService);
  });

  /**
   * checkRegistrationAvailability 메소드에 대한 테스트
   * 이 메소드는 강의 등록 가능 여부를 확인하는 기능을 테스트합니다.
   */
  describe('checkRegistrationAvailability', () => {
    /**
     * 테스트 케이스: 강의 정원이 꽉 찼을 때 LectureFullException을 throw하는지 테스트
     * 목적: checkRegistrationAvailability 메소드가 강의 정원이 가득 찼을 때 적절한 예외를 발생시키는지 확인합니다.
     */
    test('강의 정원이 꽉 찼을 때 LectureFullException을 발생시켜야 함', async () => {
      // given
      const lectureId = '1';
      const userId = 'user1';
      prismaService.lecture.findUnique.mockResolvedValue(
        new LectureVo(
          lectureId,
          'Test Lecture',
          'Test Instructor',
          new Date(),
          30,
          30,
          'hostId',
          new Date(),
          new Date(),
        ),
      );
      prismaService.registration.findUnique.mockResolvedValue(null);

      // when
      const checkAvailabilityPromise =
        registrationManager.checkRegistrationAvailability(lectureId, userId);

      // then
      await expect(checkAvailabilityPromise).rejects.toThrow(
        LectureFullException,
      );
    });

    /**
     * 테스트 케이스: 사용자가 이미 등록되어 있을 때 UserAlreadyRegisteredException을 throw하는지 테스트
     * 목적: checkRegistrationAvailability 메소드가 사용자가 이미 등록된 경우 적절한 예외를 발생시키는지 확인합니다.
     */
    test('사용자가 이미 등록되어 있을 때 UserAlreadyRegisteredException을 발생시켜야 함', async () => {
      // given
      const lectureId = '1';
      const userId = 'user1';
      prismaService.lecture.findUnique.mockResolvedValue(
        new LectureVo(
          lectureId,
          'Test Lecture',
          'Test Instructor',
          new Date(),
          30,
          29,
          'hostId',
          new Date(),
          new Date(),
        ),
      );
      prismaService.registration.findUnique.mockResolvedValue({
        id: 'registration1',
        lectureId,
        userId,
        createdAt: new Date(),
      });

      // when
      const checkAvailabilityPromise =
        registrationManager.checkRegistrationAvailability(lectureId, userId);

      // then
      await expect(checkAvailabilityPromise).rejects.toThrow(
        UserAlreadyRegisteredException,
      );
    });

    /**
     * 테스트 케이스: 강의 정원에 여유가 있고 사용자가 등록되지 않았을 때 예외가 발생하지 않는지 테스트
     * 목적: checkRegistrationAvailability 메소드가 등록 가능한 상황에서 정상적으로 작동하는지 확인합니다.
     */
    test('강의 정원에 여유가 있고 사용자가 등록되지 않았을 때 예외가 발생하지 않아야 함', async () => {
      // given
      const lectureId = '1';
      const userId = 'user1';
      prismaService.lecture.findUnique.mockResolvedValue(
        new LectureVo(
          lectureId,
          'Test Lecture',
          'Test Instructor',
          new Date(),
          30,
          29,
          'hostId',
          new Date(),
          new Date(),
        ),
      );
      prismaService.registration.findUnique.mockResolvedValue(null);

      // when
      const checkAvailabilityPromise =
        registrationManager.checkRegistrationAvailability(lectureId, userId);

      // then
      await expect(checkAvailabilityPromise).resolves.not.toThrow();
    });
  });

  /**
   * register 메소드에 대한 테스트
   * 이 메소드는 실제 강의 등록을 수행하는 기능을 테스트합니다.
   */
  describe('register', () => {
    /**
     * 테스트 케이스: 강의 등록이 성공적으로 이루어지는지 테스트
     * 목적: register 메소드가 강의 등록을 성공적으로 수행하고 올바른 결과를 반환하는지 확인합니다.
     */
    test('강의 등록이 성공적으로 이루어져야 함', async () => {
      // given
      const userId = 'user1';
      const lectureId = '1';
      const registrationStub = {
        id: 'registration1',
        lectureId,
        userId,
        createdAt: new Date(),
      };
      prismaService.lecture.update.mockResolvedValue(
        new LectureVo(
          lectureId,
          'Test Lecture',
          'Test Instructor',
          new Date(),
          30,
          30,
          'hostId',
          new Date(),
          new Date(),
        ),
      );
      prismaService.registration.create.mockResolvedValue(registrationStub);

      // when
      const result = await registrationManager.register(userId, lectureId);

      // then
      expect(result).toEqual(registrationStub);
      expect(prismaService.lecture.update).toHaveBeenCalledWith({
        where: { id: lectureId },
        data: { currentRegistrations: { increment: 1 } },
      });
    });
  });

  /**
   * findRegistrationsBy 메소드에 대한 테스트
   * 이 메소드는 특정 사용자의 등록된 강의 목록을 조회하는 기능을 테스트합니다.
   */
  describe('findRegistrationsBy', () => {
    /**
     * 테스트 케이스: 사용자의 등록된 강의 목록을 올바르게 반환하는지 테스트
     * 목적: findRegistrationsBy 메소드가 특정 사용자의 등록된 강의 목록을 정확히 반환하는지 확인합니다.
     */
    test('사용자의 등록된 강의 목록을 올바르게 반환해야 함', async () => {
      // given
      const userId = 'user1';
      const registeredLectureStub1 = new RegisteredLectureVo(
        '1',
        'Lecture 1',
        'John Doe',
      );
      const registeredLectureStub2 = new RegisteredLectureVo(
        '2',
        'Lecture 2',
        'Jane Smith',
      );
      const registrationStubs = [
        {
          id: 'registration1',
          userId,
          lectureId: '1',
          createdAt: new Date(),
          lecture: {
            id: '1',
            title: 'Lecture 1',
            instructor: 'John Doe',
            date: new Date(),
            capacity: 30,
            currentRegistrations: 1,
            hostId: 'host1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 'registration2',
          userId,
          lectureId: '2',
          createdAt: new Date(),
          lecture: {
            id: '2',
            title: 'Lecture 2',
            instructor: 'Jane Smith',
            date: new Date(),
            capacity: 30,
            currentRegistrations: 1,
            hostId: 'host2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];
      prismaService.registration.findMany.mockResolvedValue(registrationStubs);

      // when
      const result = await registrationManager.findRegistrationsBy(userId);
      const expected = [registeredLectureStub1, registeredLectureStub2];

      // then
      expect(result).toEqual(expected);
    });

    /**
     * 테스트 케이스: 등록된 강의가 없을 때 빈 배열을 반환하는지 테스트
     * 목적: findRegistrationsBy 메소드가 등록된 강의가 없는 경우 빈 배열을 반환하는지 확인합니다.
     */
    test('등록된 강의가 없을 때 빈 배열을 반환해야 함', async () => {
      // given
      const userId = 'user1';
      prismaService.registration.findMany.mockResolvedValue([]);

      // when
      const result = await registrationManager.findRegistrationsBy(userId);

      // then
      expect(result).toEqual([]);
    });
  });
});
