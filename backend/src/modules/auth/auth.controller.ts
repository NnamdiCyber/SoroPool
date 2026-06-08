import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  @ApiOperation({ summary: 'Get wallet challenge for SIWS' })
  async challenge(@Body('walletAddress') walletAddress: string) {
    return this.authService.generateChallenge(walletAddress);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify signature and issue JWT' })
  async verify(
    @Body('walletAddress') walletAddress: string,
    @Body('signature') signature: string,
    @Body('message') message: string,
  ) {
    return this.authService.verifySignature(walletAddress, signature, message);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
