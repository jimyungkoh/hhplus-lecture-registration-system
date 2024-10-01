import { ErrorCode } from 'src/common/error';
import { ApplicationException } from './application.exception';

export class LectureNotFoundException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.LECTURE_NOT_FOUND, message);
  }
}
