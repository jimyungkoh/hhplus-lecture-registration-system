import { ErrorCode } from 'src/common/error';
import { ApplicationException } from './application.exception';

export class UserAlreadyRegisteredException extends ApplicationException {
  constructor(message?: string) {
    super(ErrorCode.USER_ALREADY_REGISTERED, message);
  }
}
