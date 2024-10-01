import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { LectureManager } from 'src/application/components';
import { LectureNotFoundException } from 'src/application/exceptions';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Lecture } from '@prisma/client';
import { AvailableLectureVo, LectureVo } from 'src/domain/value-objects';

describe('LectureManager', () => {
  let lectureManager: LectureManager;
  let prismaService: DeepMockProxy<PrismaService>;

  /**
   * 각 테스트 전에 실행되는 설정
   * 테스트에 필요한 LectureManager 인스턴스와 PrismaService Mock 객체를 생성합니다.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureManager,
        { provide: PrismaService, useFactory: mockDeep<PrismaService> },
      ],
    }).compile();

    lectureManager = module.get<LectureManager>(LectureManager);
    prismaService = module.get(PrismaService);
  });

  /**
   * verifyLectureExistence 메소드에 대한 테스트
   * 이 메소드는 주어진 ID로 강의를 찾고, 찾지 못한 경우 예외를 발생시키는 기능을 테스트합니다.
   */
  describe('verifyLectureExistence', () => {
    /**
     * 테스트 케이스: 강의를 찾았을 때 아무 일도 일어나지 않아야 함
     * 목적: verifyLectureExistence 메소드가 존재하는 강의 ID로 호출되었을 때,
     *       아무런 예외도 발생하지 않는지 확인합니다.
     */
    test('강의를 찾았을 때 아무 일도 일어나지 않아야 함', async () => {
      const lectureStub = new LectureVo(
        '1',
        'Test Lecture',
        'John Doe',
        new Date(),
        20,
        0,
        '1',
        new Date(),
        new Date(),
      );
      prismaService.lecture.findUnique.mockResolvedValue(lectureStub);

      await expect(
        lectureManager.verifyLectureExistence('1', undefined),
      ).resolves.not.toThrow();
    });

    /**
     * 테스트 케이스: 강의를 찾지 못했을 때 LectureNotFoundException을 throw하는지 테스트
     * 목적: verifyLectureExistence 메소드가 존재하지 않는 강의 ID로 호출되었을 때,
     *       적절한 예외(LectureNotFoundException)를 발생시키는지 확인합니다.
     */
    test('강의를 찾지 못했을 때 LectureNotFoundException을 발생시켜야 함', async () => {
      prismaService.lecture.findUnique.mockResolvedValue(null);

      await expect(
        lectureManager.verifyLectureExistence('1', undefined),
      ).rejects.toThrow(LectureNotFoundException);
    });
  });

  /**
   * findAvailableLectures 메소드에 대한 테스트
   * 이 메소드는 특정 날짜에 이용 가능한 강의 목록을 반환하는 기능을 테스트합니다.
   */
  describe('findAvailableLectures', () => {
    /**
     * 테스트 케이스: 수용 인원에 여유가 있는 강의만 반환하는지 테스트
     * 목적: findAvailableLectures 메소드가 특정 날짜의 강의 중
     *       수용 인원에 여유가 있는 강의만을 올바르게 필터링하여 반환하는지 확인합니다.
     *       이 테스트는 다양한 상황(여유 있음, 만석, 일부 여유)의 강의를 포함하여
     *       메소드의 필터링 로직이 정확히 작동하는지 검증합니다.
     */
    test('특정 날짜의 이용 가능한 강의만 올바르게 반환해야 함', async () => {
      const lectureStubs: Lecture[] = [
        new LectureVo(
          '1',
          'Lecture 1',
          'John Doe',
          new Date('2023-05-01T10:00:00Z'),
          10,
          5,
          '1',
          new Date(),
          new Date(),
        ),
        new LectureVo(
          '2',
          'Lecture 2',
          'Jane Smith',
          new Date('2023-05-01T14:00:00Z'),
          10,
          10,
          '2',
          new Date(),
          new Date(),
        ),
        new LectureVo(
          '3',
          'Lecture 3',
          'Bob Johnson',
          new Date('2023-05-01T16:00:00Z'),
          10,
          8,
          '3',
          new Date(),
          new Date(),
        ),
      ];

      prismaService.lecture.findMany.mockResolvedValue(lectureStubs);

      const result = await lectureManager.findAvailableLectures('2023-05-01');

      expect(result).toEqual([
        new AvailableLectureVo(
          '1',
          'Lecture 1',
          'John Doe',
          new Date('2023-05-01T10:00:00Z'),
          10,
          5,
        ),
        new AvailableLectureVo(
          '3',
          'Lecture 3',
          'Bob Johnson',
          new Date('2023-05-01T16:00:00Z'),
          10,
          8,
        ),
      ]);
    });

    /**
     * 테스트 케이스: 이용 가능한 강의가 없을 때 빈 배열을 반환하는지 테스트
     * 목적: findAvailableLectures 메소드가 특정 날짜에 이용 가능한 강의가 전혀 없는 경우,
     *       빈 배열을 반환하는지 확인합니다. 이는 메소드가 '결과 없음' 상황을
     *       올바르게 처리하는지 검증합니다.
     */
    test('이용 가능한 강의가 없을 때 빈 배열을 반환해야 함', async () => {
      prismaService.lecture.findMany.mockResolvedValue([]);

      const result = await lectureManager.findAvailableLectures('2023-05-01');

      expect(result).toEqual([]);
    });
  });
});
