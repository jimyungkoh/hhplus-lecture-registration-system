import { GenericContainer, Wait } from 'testcontainers';
import { PROJECT_ROOT } from 'src/common/config/path';

export class ServerContainer extends GenericContainer {
  static async createInstance(dbPath: string): Promise<GenericContainer> {
    const container = new GenericContainer('node:20-alpine')
      .withBindMounts([
        {
          source: dbPath,
          target: '/app/data/test.db',
          mode: 'rw',
        },
      ])
      .withWorkingDir('/app')
      .withCopyDirectoriesToContainer([
        {
          source: PROJECT_ROOT,
          target: '/app',
        },
      ])
      .withExposedPorts(3_000)
      .withEnvironment({
        PORT: '3000',
        DATABASE_URL: `file:/app/data/test.db`,
      })
      .withCommand([
        'sh',
        '-c',
        `
        set -ex

        apk add --no-cache sqlite openssl
        npm ci

        npx prisma generate

        npm run build
        npm run start:prod
        `,
      ])
      .withWaitStrategy(Wait.forHttp('/', 3_000).forStatusCode(200));
    return container;
  }
}
