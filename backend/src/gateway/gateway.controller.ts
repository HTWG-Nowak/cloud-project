import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { DecodedIdToken } from 'firebase-admin/auth';
import { AuthGuard } from 'src/gards/auth.gard';

@Controller()
@UseGuards(AuthGuard)
export class GatewayController {
  constructor(private readonly service: GatewayService) {}

  @Get()
  hello(@Req() req): Promise<String> {
    const user: DecodedIdToken = req.user;
    const userId = user?.uid;
    const tenantId = user?.tenant;
    return this.service.hello(userId, tenantId);
  }
}
