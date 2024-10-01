import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { LectureService } from 'src/application/services';
import {
  AvailableLectureVo,
  RegisteredLectureVo,
  RegistrationVo,
} from 'src/domain/value-objects';

@Controller('lectures')
export class LectureController {
  constructor(private readonly lectureService: LectureService) {}

  /**
   * API Specs 1. 특강 신청 API
   * 특정 userId로 선착순으로 제공되는 특강을 신청합니다.
   * 동일한 신청자는 동일한 강의에 대해서 한 번의 수강 신청만 성공할 수 있습니다.
   * 특강은 선착순 30명만 신청 가능합니다.
   * 이미 신청자가 30명이 초과되면 이후 신청자는 요청을 실패합니다.
   * @param userId 사용자 ID
   * @param lectureId 특강 ID
   * @returns 등록 정보
   */
  @Post('register')
  async registerForLecture(
    @Body('userId') userId: string,
    @Body('lectureId') lectureId: string,
  ): Promise<RegistrationVo> {
    return this.lectureService.registerForLecture(userId, lectureId);
  }

  /**
   * API Specs 2. 특강 선택 API
   * 날짜별로 현재 신청 가능한 특강 목록을 조회합니다.
   * 특강의 정원은 30명으로 고정이며, 사용자는 각 특강에 신청하기전 목록을 조회해볼 수 있어야 합니다.
   * @param dateString 조회할 날짜
   * @returns 신청 가능한 특강 목록
   */
  @Get('available/:date')
  async findAvailableLectures(
    @Param('date') dateString: string,
  ): Promise<AvailableLectureVo[]> {
    return this.lectureService.findAvailableLectures(dateString);
  }

  /**
   * API Specs 3. 특강 신청 완료 목록 조회 API
   * 특정 userId로 신청 완료된 특강 목록을 조회합니다.
   * 각 항목은 특강 ID 및 이름, 강연자 정보를 담고 있어야 합니다.
   * @param userId 사용자 ID
   * @returns 사용자가 신청한 특강 목록
   */
  @Get('registrations/:userId')
  async getUserRegistrations(
    @Param('userId') userId: string,
  ): Promise<RegisteredLectureVo[]> {
    return this.lectureService.getUserRegistrations(userId);
  }
}
