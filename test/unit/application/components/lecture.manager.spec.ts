import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { LectureManager } from 'src/application/components';
import { LectureNotFoundException } from 'src/application/exceptions';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Lecture } from '@prisma/client';
import { AvailableLectureVo } from 'src/domain/value-objects';

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
   * checkLectureExists 메소드에 대한 테스트
   * 이 메소드는 주어진 ID로 강의를 찾고, 찾지 못한 경우 예외를 발생시키는 기능을 테스트합니다.
   */
  describe('checkLectureExists', () => {
    /**
     * 테스트 케이스: 강의를 찾았을 때 아무 일도 일어나지 않아야 함
     * 목적: checkLectureExists 메소드가 존재하는 강의 ID로 호출되었을 때,
     *       아무런 예외도 발생하지 않는지 확인합니다.
     */
    test('강의를 찾았을 때 아무 일도 일어나지 않아야 함', async () => {
      // given
      const lectureStub = {
        id: '1',
        title: 'Test Lecture',
        instructor: 'John Doe',
        date: new Date(),
        capacity: 20,
        currentRegistrations: 0,
        hostId: 'host1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.lecture.findUnique.mockResolvedValue(lectureStub);

      // when
      const resultPromise = lectureManager.checkLectureExists('1', undefined);

      // then
      await expect(resultPromise).resolves.not.toThrow();
    });

    /**
     * 테스트 케이스: 강의를 찾지 못했을 때 LectureNotFoundException을 throw하는지 테스트
     * 목적: checkLectureExists 메소드가 존재하지 않는 강의 ID로 호출되었을 때,
     *       적절한 예외(LectureNotFoundException)를 발생시키는지 확인합니다.
     */
    test('강의를 찾지 못했을 때 LectureNotFoundException을 발생시켜야 함', async () => {
      // given
      prismaService.lecture.findUnique.mockResolvedValue(null);

      // when
      const resultPromise = lectureManager.checkLectureExists('1', undefined);

      // then
      await expect(resultPromise).rejects.toThrow(LectureNotFoundException);
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
      // given
      const lectureStubs: Lecture[] = [
        {
          id: '1',
          title: 'Lecture 1',
          instructor: 'John Doe',
          date: new Date('2023-05-01T10:00:00Z'),
          capacity: 10,
          currentRegistrations: 5,
          hostId: 'host1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Lecture 2',
          instructor: 'Jane Smith',
          date: new Date('2023-05-01T14:00:00Z'),
          capacity: 10,
          currentRegistrations: 10,
          hostId: 'host2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          title: 'Lecture 3',
          instructor: 'Bob Johnson',
          date: new Date('2023-05-01T16:00:00Z'),
          capacity: 10,
          currentRegistrations: 8,
          hostId: 'host3',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.lecture.findMany.mockResolvedValue(lectureStubs);

      // when
      const result = await lectureManager.findAvailableLectures('2023-05-01');

      // then
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
      // given
      prismaService.lecture.findMany.mockResolvedValue([]);

      // when
      const result = await lectureManager.findAvailableLectures('2023-05-01');

      // then
      expect(result).toEqual([]);
    });
  });
});
