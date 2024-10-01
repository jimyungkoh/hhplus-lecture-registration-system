import { ErrorCode } from 'src/common/error';
import { ApplicationException } from './application.exception';

export class LectureFullException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.LECTURE_FULL, message);
  }
}
