import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateChallenge(walletAddress: string): Promise<{ nonce: string; message: string }> {
    const nonce = Math.random().toString(36).substring(2, 15);
    const message = `SoroPool Sign-In\nWallet: ${walletAddress}\nNonce: ${nonce}`;
    return { nonce, message };
  }

  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const keypair = StellarSdk.Keypair.fromPublicKey(walletAddress);
      const signatureBuffer = Buffer.from(signature, 'base64');
      const messageBuffer = Buffer.from(message);
      const isValid = keypair.verify(messageBuffer, signatureBuffer);
      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch {
      throw new UnauthorizedException('Signature verification failed');
    }

    const accessToken = this.jwtService.sign({ sub: walletAddress });
    const refreshToken = this.jwtService.sign(
      { sub: walletAddress, type: 'refresh' },
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    const payload = this.jwtService.verify(token);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const accessToken = this.jwtService.sign({ sub: payload.sub });
    return { accessToken };
  }
}
