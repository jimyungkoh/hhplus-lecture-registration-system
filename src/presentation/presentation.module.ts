import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { AppController, LectureController } from './controllers';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters';

@Module({
  controllers: [AppController, LectureController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  imports: [ApplicationModule],
})
export class PresentationModule {}
