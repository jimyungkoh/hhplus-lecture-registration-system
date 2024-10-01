import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { LectureService } from './services';
import { LectureManager, RegistrationManager } from './components';

@Module({
  imports: [InfrastructureModule],
  providers: [LectureService, RegistrationManager, LectureManager],
  exports: [LectureService],
})
export class ApplicationModule {}
