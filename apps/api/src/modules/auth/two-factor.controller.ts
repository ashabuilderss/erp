import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

interface RequestUser {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setup(@CurrentUser() user: RequestUser) {
    return this.twoFactorService.setup(user.id);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verify(
    @CurrentUser() user: RequestUser,
    @Body() body: { token: string },
  ) {
    return this.twoFactorService.verify(user.id, body.token);
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  async disable(
    @CurrentUser() user: RequestUser,
    @Body() body: { password: string },
  ) {
    return this.twoFactorService.disable(user.id, body.password);
  }

  @Post('backup-codes')
  @UseGuards(JwtAuthGuard)
  async backupCodes(@CurrentUser() user: RequestUser) {
    return this.twoFactorService.generateBackupCodes(user.id);
  }

  @Post('authenticate')
  @Public()
  async authenticate(@Body() body: { tempToken: string; code: string }) {
    return this.twoFactorService.authenticate(body.tempToken, body.code);
  }
}
