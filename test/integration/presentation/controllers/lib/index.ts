import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { PrismaClient } from '@prisma/client';

/**
 * 임시 SQLite 디렉토리를 생성합니다.
 * @returns {Object} 생성된 디렉토리 경로와 데이터베이스 파일 경로를 포함하는 객체
 * @property {string} dir 생성된 임시 디렉토리의 경로
 * @property {string} dbPath 생성된 SQLite 데이터베이스 파일의 경로
 */
export const createTempSqliteDirectory = (): {
  dir: string;
  dbPath: string;
} => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-'));
  const dbPath = path.join(dir, 'test.db');

  // 빈 파일 생성 (기존 방식 유지)
  fs.closeSync(fs.openSync(dbPath, 'w'));

  return { dir, dbPath };
};

/**
 * Prisma 데이터베이스를 설정합니다.
 * @param {string} dbPath - 데이터베이스 파일 경로
 * @param {string} schemaPath - Prisma 스키마 파일 경로
 */
export const setupPrismaDatabase = async (
  dbPath: string,
  schemaPath: string,
): Promise<void> => {
  const execPromise = promisify(exec);
  await execPromise(`npx prisma db push --schema ${schemaPath}`, {
    env: {
      ...process.env,
      DATABASE_URL: `file:${dbPath}`,
    },
  });
};

/**
 * 지정된 수의 컨테이너를 시작합니다.
 * @param {number} count - 시작할 컨테이너 수
 * @param {function(): Promise<GenericContainer>} createContainerInstance - 컨테이너 인스턴스 생성 함수
 * @returns {Promise<StartedTestContainer[]>} 시작된 컨테이너 배열
 */
export const startContainers = async (
  count: number,
  createContainerInstance: () => Promise<GenericContainer>,
): Promise<StartedTestContainer[]> => {
  return Promise.all(
    Array.from({ length: count }).map(async () => {
      const containerInstance = await createContainerInstance();
      return containerInstance.start();
    }),
  );
};

/**
 * 리소스를 정리합니다.
 * @param {StartedTestContainer[]} containers - 정리할 컨테이너 배열
 * @param {string} tempDir - 삭제할 임시 디렉토리 경로
 */
export const cleanupResources = async (
  containers: StartedTestContainer[],
  tempDir: string,
): Promise<void> => {
  await Promise.all(containers.map((c) => c.stop()));
  fs.rmSync(tempDir, { recursive: true, force: true });
};

/**
 * 데이터베이스에 테스트 데이터를 생성합니다.
 * @param {PrismaClient} prismaClient - Prisma 클라이언트 인스턴스
 */
export const seedTestData = async (
  prismaClient: PrismaClient,
): Promise<void> => {
  await prismaClient.registration.deleteMany();
  await prismaClient.lecture.deleteMany();
  await prismaClient.user.deleteMany();

  await prismaClient.$transaction(async (tx) => {
    await tx.user.createMany({
      data: Array(40)
        .fill(null)
        .map((_, index) => ({
          id: `${index + 1}`,
          name: `User ${index + 1}`,
        })),
    });
    await tx.lecture.create({
      data: {
        id: '1',
        title: '클린아키텍처',
        instructor: '홍길동',
        date: new Date('2024-10-03'),
        hostId: '1',
        capacity: 30,
      },
    });
  });
};
