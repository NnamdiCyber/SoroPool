import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

// Mock stellar-sdk keypair
jest.mock('stellar-sdk', () => ({
  Keypair: {
    fromPublicKey: jest.fn().mockReturnValue({
      verify: jest.fn().mockReturnValue(true),
    }),
    random: jest.fn().mockReturnValue({
      publicKey: jest.fn().mockReturnValue('GPUBKEY'),
      secret: jest.fn().mockReturnValue('SSECRET'),
    }),
  },
}));

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('generateChallenge returns nonce and message for wallet', async () => {
    const result = await service.generateChallenge('GADDR123');
    expect(result.nonce).toBeTruthy();
    expect(result.message).toContain('GADDR123');
    expect(result.message).toContain(result.nonce);
  });

  it('verifySignature returns JWT pair on valid signature', async () => {
    const { nonce, message } = await service.generateChallenge('GPUBKEY');
    const result = await service.verifySignature(
      'GPUBKEY',
      Buffer.from('fakesig').toString('base64'),
      message,
    );
    expect(result.accessToken).toBe('mock.jwt.token');
    expect(result.refreshToken).toBe('mock.jwt.token');
    expect(mockJwtService.sign).toHaveBeenCalled();
  });

  it('verifySignature throws on invalid signature', async () => {
    const StellarSdk = await import('stellar-sdk');
    StellarSdk.Keypair.fromPublicKey.mockReturnValueOnce({
      verify: jest.fn().mockReturnValue(false),
    });

    await expect(
      service.verifySignature('GPUBKEY', 'badsig', 'some message'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refreshToken returns new access token for valid refresh token', async () => {
    mockJwtService.verify.mockReturnValueOnce({ sub: 'GPUBKEY', type: 'refresh' });
    const result = await service.refreshToken('valid.refresh.token');
    expect(result.accessToken).toBe('mock.jwt.token');
  });

  it('refreshToken throws for non-refresh token', async () => {
    mockJwtService.verify.mockReturnValueOnce({ sub: 'GPUBKEY', type: 'access' });
    await expect(service.refreshToken('bad.token')).rejects.toThrow(UnauthorizedException);
  });
});
