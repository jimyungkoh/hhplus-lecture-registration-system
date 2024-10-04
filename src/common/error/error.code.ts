/**
 * 에러 코드를 관리하는 클래스입니다.
 */
export class ErrorCode {
  /**
   * ErrorCodes 클래스의 생성자입니다.
   */
  private constructor(
    readonly status: number,
    readonly code: number,
    readonly message: string,
  ) {}

  /**
   * 강의를 찾을 수 없을 때 발생하는 에러입니다.
   */
  static readonly LECTURE_NOT_FOUND: ErrorCode = new ErrorCode(
    404,
    1001,
    '강의를 찾을 수 없습니다',
  );

  /**
   * 강의가 가득 찼을 때 발생하는 에러입니다.
   */
  static readonly LECTURE_FULL: ErrorCode = new ErrorCode(
    409,
    2001,
    '강의 수강 인원이 가득 찼습니다',
  );

  /**
   * 사용자가 이미 강의에 등록되어 있을 때 발생하는 에러입니다.
   */
  static readonly USER_ALREADY_REGISTERED: ErrorCode = new ErrorCode(
    409,
    2002,
    '사용자가 이미 이 강의에 등록되어 있습니다',
  );

  static readonly REGISTRATION_FAIL: ErrorCode = new ErrorCode(
    409,
    2003,
    '강의 등록에 실패했습니다. 다시 시도해주세요.',
  );
}
