import { ApplicationException } from './application.exception';
import { ErrorCode } from 'src/common/error';

export class RegistrationFailException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.REGISTRATION_FAIL, message);
  }
}
