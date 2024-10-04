import * as fs from 'fs';
import { StartedTestContainer } from 'testcontainers';
import { ServerContainer } from './containers/server.container';
import axios from 'axios';
import {
  createTempSqliteDirectory,
  seedTestData,
  setupPrismaDatabase,
  startContainers,
} from './lib';
import { PROJECT_ROOT } from 'src/common/config/path';
import { PrismaClient } from '@prisma/client';

/**
 * LectureController 통합 테스트
 */
describe('LectureController (Integration)', () => {
  jest.setTimeout(600000);
  let containers: StartedTestContainer[];
  let prismaClient: PrismaClient;
  let temp: string;
  /**
   * 모든 테스트 전에 실행되는 설정
   */
  beforeAll(async () => {
    try {
      // SQLite 데이터베이스를 저장할 임시 디렉토리 생성
      const { dir: tempDir, dbPath: hostDbPath } = createTempSqliteDirectory();
      temp = tempDir;
      // 데이터베이스 초기화
      const prismaSchemaPath = `${PROJECT_ROOT}/src/infrastructure/prisma/schema.prisma`;
      process.env.DATABASE_URL = `file:${hostDbPath}`;

      await setupPrismaDatabase(hostDbPath, prismaSchemaPath);

      prismaClient = new PrismaClient({
        datasourceUrl: `file:${hostDbPath}`,
      });

      await seedTestData(prismaClient);

      // 테스트 인스턴스 실행(4개)
      containers = await startContainers(4, () =>
        ServerContainer.createInstance(hostDbPath),
      );
    } catch (e) {
      prismaClient.$disconnect();
      await Promise.all(containers.map((c) => c.stop()));
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }, 180_000);

  /**
   * 모든 테스트 후에 실행되는 정리
   */
  afterAll(async () => {
    try {
      prismaClient.$disconnect();
      await Promise.all(containers.map((c) => c.stop()));
      fs.rmSync(temp, { recursive: true, force: true });
    } catch (error) {}
  });

  /**
   * 각 테스트 전에 실행되는 데이터 초기화
   */
  beforeEach(async () => {
    // 테스트 데이터 생성
    await seedTestData(prismaClient);
  });

  /**
   * API Specs 1. 특강 신청 API 테스트
   */
  describe('특강 신청 API', () => {
    test('특강 신청 API', async () => {
      const userId = '11';
      const lectureId = '1';
      const container = containers[0];
      const port = container.getMappedPort(3000);

      try {
        const response = await axios.post(
          `http://localhost:${port}/lectures/register`,
          {
            userId,
            lectureId,
          },
        );
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          id: expect.any(String),
          userId,
          lectureId,
        });

        const registrationCount = await prismaClient.registration.count({
          where: { userId, lectureId },
        });
        expect(registrationCount).toBe(1);
      } catch (error) {
        throw error;
      }
    });
  });

  describe('API Specs 2. 특강 선택 API 테스트', () => {
    test('특강 선택 API', async () => {
      const dateString = '2024-10-03';
      const container = containers[0];
      const port = container.getMappedPort(3000);
      try {
        const response = await axios.get(
          `http://localhost:${port}/lectures/available/${dateString}`,
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);

        const lecture = response.data[0];
        expect(lecture).toEqual({
          id: expect.any(String),
          title: expect.any(String),
          instructor: expect.any(String),
          date: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
          ),
          capacity: expect.any(Number),
          currentRegistrations: expect.any(Number),
        });

        expect(lecture.capacity).toBeGreaterThan(lecture.currentRegistrations);
        expect(new Date(lecture.date)).toBeInstanceOf(Date);
      } catch (error) {
        throw error;
      }
    });
  });

  describe('API Specs 3. 특강 신청 완료 목록 조회 API 테스트', () => {
    test('특강 신청 완료 목록 조회 API', async () => {
      const userId = '1';
      const lectureId = '1';
      const container = containers[0];
      const port = container.getMappedPort(3000);

      try {
        // 먼저 특강 신청
        await axios.post(`http://localhost:${port}/lectures/register`, {
          userId,
          lectureId,
        });

        // 신청 완료 목록 조회
        const response = await axios.get(
          `http://localhost:${port}/lectures/registrations/${userId}`,
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBeTruthy();
        expect(response.data.length).toBe(1);
        expect(response.data[0]).toHaveProperty('id', lectureId);
        expect(response.data[0]).toHaveProperty('title');
        expect(response.data[0]).toHaveProperty('instructor');
      } catch (error) {
        throw error;
      }
    });
  });

  describe('동시에 40명이 신청했을 때, 30명만 성공하는 것을 검증하는 통합 테스트', () => {
    test('동시에 40명이 신청했을 때, 30명만 성공', async () => {
      const lectureId = '1';
      const totalRequests = 40;
      const expectedSuccessful = 30;

      const requests = Array.from({ length: totalRequests }, (_, i) => ({
        userId: `${i + 1}`,
        lectureId,
      }));

      const results = await Promise.allSettled(
        requests.map(async (request, index) => {
          const containerIndex = index % containers.length;
          const container = containers[containerIndex];
          const port = container.getMappedPort(3000);

          try {
            return await axios.post(
              `http://localhost:${port}/lectures/register`,
              request,
              { timeout: 40_000 }, // 타임아웃을 30초로 설정
            );
          } catch (error) {
            if (axios.isAxiosError(error)) {
              return error.response;
            }
            throw error;
          }
        }),
      );
      const successfulRegistrations = results.filter(
        (result) =>
          result.status === 'fulfilled' &&
          'value' in result &&
          result.value &&
          'status' in result.value &&
          result.value.status === 201,
      ).length;

      expect(successfulRegistrations).toBe(expectedSuccessful);

      const registrationCount = await prismaClient.registration.count({
        where: { lectureId },
      });
      expect(registrationCount).toBe(expectedSuccessful);
    }, 600_000);
  });

  describe('동일한 유저 정보로 같은 특강을 5번 신청했을 때, 1번만 성공하는 것을 검증하는 통합 테스트', () => {
    test('동일한 유저가 5번 신청했을 때, 1번만 성공', async () => {
      const userId = '1';
      const lectureId = '1';
      const container = containers[0];
      const port = container.getMappedPort(3_000);

      const registrationPromises = Array(5)
        .fill(null)
        .map(() =>
          axios.post(`http://localhost:${port}/lectures/register`, {
            userId,
            lectureId,
          }),
        );

      const results = await Promise.allSettled(registrationPromises);
      const successfulRegistrations = results.filter(
        (result) => result.status === 'fulfilled',
      ).length;

      expect(successfulRegistrations).toBe(1);

      const registrationCount = await prismaClient.registration.count({
        where: { userId, lectureId },
      });
      expect(registrationCount).toBe(1);
    }, 30_000);
  });
});
