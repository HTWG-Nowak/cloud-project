import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { REPORT_SERVICE_URL } from './report.pb';
import { ReportService } from './report.service';
import { DecodedIdToken } from 'firebase-admin/auth';
import { AuthGuard } from 'src/auth/auth.gard';

@Controller(REPORT_SERVICE_URL)
@UseGuards(AuthGuard)
export class ReportController {
  @Inject(ReportService)
  private readonly service: ReportService;

  @Get()
  hello(@Req() req): Promise<String> {
    const user: DecodedIdToken = req.user;
    const userId = user?.uid;
    const tenantId = user?.tenant;
    return this.service.hello(userId, tenantId);
  }
}
