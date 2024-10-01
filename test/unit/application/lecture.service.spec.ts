import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  RegistrationVo,
  RegisteredLectureVo,
  AvailableLectureVo,
} from 'src/domain/value-objects';
import { LectureService } from 'src/application/services';
import {
  LectureManager,
  RegistrationManager,
} from 'src/application/components';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('LectureService', () => {
  let service: LectureService;
  let prismaService: DeepMockProxy<PrismaService>;
  let lectureManager: DeepMockProxy<LectureManager>;
  let registrationManager: DeepMockProxy<RegistrationManager>;

  /**
   * 각 테스트 전에 실행되는 설정
   * 테스트에 필요한 LectureService 인스턴스와 관련 의존성들의 Mock 객체를 생성합니다.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: LectureManager,
          useValue: mockDeep<LectureManager>(),
        },
        {
          provide: RegistrationManager,
          useValue: mockDeep<RegistrationManager>(),
        },
      ],
    }).compile();

    service = module.get<LectureService>(LectureService);
    prismaService = module.get(PrismaService);
    lectureManager = module.get(LectureManager);
    registrationManager = module.get(RegistrationManager);
  });

  /**
   * registerForLecture 메소드에 대한 테스트
   * 이 메소드는 사용자를 강의에 등록하는 기능을 테스트합니다.
   */
  describe('registerForLecture', () => {
    /**
     * 테스트 케이스: 사용자를 강의에 성공적으로 등록해야 함
     * 목적: registerForLecture 메소드가 사용자를 강의에 올바르게 등록하고,
     *       필요한 모든 검증 과정을 거치는지 확인합니다.
     */
    test('사용자를 강의에 성공적으로 등록해야 함', async () => {
      // given
      const userId = 'user1';
      const lectureId = 'lecture1';
      const registrationStub: RegistrationVo = {
        id: 'registration1',
        userId,
        lectureId,
        createdAt: new Date(),
      };

      prismaService.$transaction.mockImplementation(async (arg: any) => {
        if (typeof arg === 'function') {
          return arg(prismaService);
        } else if (Array.isArray(arg)) {
          return Promise.all(arg.map((promise) => promise(prismaService)));
        }
        throw new Error('Invalid argument type for $transaction');
      });

      lectureManager.verifyLectureExistence.mockResolvedValue(undefined);
      registrationManager.checkRegistrationAvailability.mockResolvedValue(
        undefined,
      );
      registrationManager.register.mockResolvedValue(registrationStub);

      // when
      const result = await service.registerForLecture(userId, lectureId);

      // then
      expect(result).toEqual(registrationStub);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(lectureManager.verifyLectureExistence).toHaveBeenCalledWith(
        lectureId,
        prismaService,
      );
      expect(
        registrationManager.checkRegistrationAvailability,
      ).toHaveBeenCalledWith(lectureId, userId, prismaService);
      expect(registrationManager.register).toHaveBeenCalledWith(
        userId,
        lectureId,
        prismaService,
      );
    });
  });

  /**
   * findAvailableLectures 메소드에 대한 테스트
   * 이 메소드는 특정 날짜에 이용 가능한 강의 목록을 반환하는 기능을 테스트합니다.
   */
  describe('findAvailableLectures', () => {
    /**
     * 테스트 케이스: 주어진 날짜에 대해 이용 가능한 강의를 반환해야 함
     * 목적: findAvailableLectures 메소드가 특정 날짜에 대해
     *       이용 가능한 강의 목록을 올바르게 반환하는지 확인합니다.
     */
    test('주어진 날짜에 대해 이용 가능한 강의를 반환해야 함', async () => {
      // given
      const dateString = '2023-05-20';
      const lecturesStub: AvailableLectureVo[] = [
        new AvailableLectureVo(
          'lecture1',
          'Lecture 1',
          'Speaker 1',
          new Date(dateString),
          50,
          0,
        ),
        new AvailableLectureVo(
          'lecture2',
          'Lecture 2',
          'Speaker 2',
          new Date(dateString),
          50,
          0,
        ),
      ];

      lectureManager.findAvailableLectures.mockResolvedValue(lecturesStub);

      // when
      const result = await service.findAvailableLectures(dateString);

      // then
      expect(result).toEqual(lecturesStub);
      expect(lectureManager.findAvailableLectures).toHaveBeenCalledWith(
        dateString,
      );
    });
  });

  /**
   * getUserRegistrations 메소드에 대한 테스트
   * 이 메소드는 사용자가 등록한 강의 목록을 반환하는 기능을 테스트합니다.
   */
  describe('getUserRegistrations', () => {
    /**
     * 테스트 케이스: 사용자가 등록한 강의 목록을 반환해야 함
     * 목적: getUserRegistrations 메소드가 특정 사용자에 대해
     *       등록된 강의 목록을 올바르게 반환하는지 확인합니다.
     */
    test('사용자가 등록한 강의 목록을 반환해야 함', async () => {
      // given
      const userId = 'user1';
      const registeredLecturesStub: RegisteredLectureVo[] = [
        new RegisteredLectureVo('reg1', 'Lecture 1', 'instructor1'),
        new RegisteredLectureVo('reg2', 'Lecture 2', 'instructor2'),
      ];

      registrationManager.findRegistrationsBy.mockResolvedValue(
        registeredLecturesStub,
      );

      // when
      const result = await service.getUserRegistrations(userId);

      // then
      expect(result).toEqual(registeredLecturesStub);
      expect(registrationManager.findRegistrationsBy).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
