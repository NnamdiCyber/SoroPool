import { Injectable } from '@nestjs/common';

@Injectable()
export class GraphService {
  async buildGraph() {
    return { nodes: [], edges: [] };
  }
}
