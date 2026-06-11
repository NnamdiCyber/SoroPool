import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../../database/entities/token.entity';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  async findAll(): Promise<Token[]> {
    return this.tokenRepository.find();
  }

  async findById(id: string): Promise<Token | null> {
    return this.tokenRepository.findOne({ where: { id } });
  }

  async findByContract(contractAddress: string): Promise<Token | null> {
    return this.tokenRepository.findOne({ where: { contractAddress } });
  }

  async findBySymbol(symbol: string): Promise<Token | null> {
    return this.tokenRepository.findOne({ where: { symbol } });
  }

  async findOrCreate(contractAddress: string, metadata?: { symbol?: string; name?: string; decimals?: number }): Promise<Token> {
    const existing = await this.findByContract(contractAddress);
    if (existing) return existing;

    if (metadata?.symbol && metadata?.name) {
      const token = this.tokenRepository.create({
        contractAddress,
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals ?? 7,
        isVerified: false,
      });
      return this.tokenRepository.save(token);
    }

    try {
      const chainMetadata = await this.fetchChainMetadata(contractAddress);
      const token = this.tokenRepository.create({
        contractAddress,
        symbol: chainMetadata.symbol,
        name: chainMetadata.name,
        decimals: chainMetadata.decimals,
        isVerified: false,
      });
      return this.tokenRepository.save(token);
    } catch (err) {
      this.logger.error(`Failed to fetch metadata for ${contractAddress}`, err);
      const fallback = this.tokenRepository.create({
        contractAddress,
        symbol: 'UNKNOWN',
        name: `Token ${contractAddress.slice(0, 8)}`,
        decimals: 7,
        isVerified: false,
      });
      return this.tokenRepository.save(fallback);
    }
  }

  private async fetchChainMetadata(contractAddress: string): Promise<{ symbol: string; name: string; decimals: number }> {
    const response = await fetch(
      `${process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'}/contracts/${contractAddress}/metadata`,
    );
    if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    const data = await response.json();
    return { symbol: data.symbol || 'UNKNOWN', name: data.name || 'Unknown', decimals: data.decimals ?? 7 };
  }
}
