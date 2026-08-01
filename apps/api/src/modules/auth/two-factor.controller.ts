import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';
import {
  VerifyTwoFactorDto,
  DisableTwoFactorDto,
  AuthenticateTwoFactorDto,
} from './dto/two-factor.dto';

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
    @Body() dto: VerifyTwoFactorDto,
  ) {
    return this.twoFactorService.verify(user.id, dto.token);
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  async disable(
    @CurrentUser() user: RequestUser,
    @Body() dto: DisableTwoFactorDto,
  ) {
    return this.twoFactorService.disable(user.id, dto.password);
  }

  @Post('backup-codes')
  @UseGuards(JwtAuthGuard)
  async backupCodes(@CurrentUser() user: RequestUser) {
    return this.twoFactorService.generateBackupCodes(user.id);
  }

  @Post('authenticate')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async authenticate(@Body() dto: AuthenticateTwoFactorDto) {
    return this.twoFactorService.authenticate(dto.tempToken, dto.code);
  }
}
