// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGameBlockTimestamp, clearCache } from '../blockTimestampService';
import celoService from '../../chess/services/celoService';

// Mock celoService getPublicClient
vi.mock('../../chess/services/celoService', () => {
  const mockBlock = { timestamp: 1690000000n };
  const mockPublicClient = {
    getBlock: vi.fn().mockResolvedValue(mockBlock),
  };
  return {
    default: {
      getPublicClient: () => mockPublicClient,
    },
  };
});

describe('BlockTimestampService', () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Stub global fetch
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    
    // Clear the cache manually since it's a module-level variable
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Celo Timestamp Resolution', () => {
    it('should fetch block timestamp from Celoscan v2 API and cache it', async () => {
      const mockCeloscanResponse = {
        status: '1',
        message: 'OK',
        result: [
          {
            input: '0x2d913e350000000000000000000000000000000000000000000000000000000000000064', // createGame selector
            isError: '0',
            timeStamp: '1680000000',
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockCeloscanResponse,
      });

      const timestamp = await getGameBlockTimestamp('celo', 1);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain('api.celoscan.io/api');
      expect(timestamp).toBe(1680000000 * 1000);

      // Call again to verify in-memory cache is used and fetch is not called
      const cachedTimestamp = await getGameBlockTimestamp('celo', 1);
      expect(fetchMock).toHaveBeenCalledTimes(1); // Still 1
      expect(cachedTimestamp).toBe(1680000000 * 1000);
    });

    it('should fallback to viem getBlock on Celoscan API error', async () => {
      // Celoscan returns error
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const client = celoService.getPublicClient();
      vi.mocked(client.getBlock).mockResolvedValueOnce({
        timestamp: 1690000000n,
      } as any);

      const timestamp = await getGameBlockTimestamp('celo', 2);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(client.getBlock).toHaveBeenCalledWith({ blockTag: 'latest' });
      expect(timestamp).toBe(1690000000 * 1000);
    });
  });

  describe('Stacks Timestamp Resolution', () => {
    it('should query Hiro API events and transactions to resolve Stacks game timestamp', async () => {
      const contractId = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.chessxu';
      
      // 1. Mock first page of contract events
      const mockEventsResponse = {
        limit: 50,
        offset: 0,
        total: 1,
        results: [
          {
            tx_id: '0xTx123',
            event_type: 'smart_contract_log',
          },
        ],
      };

      // 2. Mock Stacks transaction response showing create-game call
      const mockTxResponse = {
        tx_id: '0xTx123',
        burn_block_time: 1681000000,
        tx_type: 'contract_call',
        contract_call: {
          function_name: 'create-game',
        },
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockEventsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTxResponse,
        });

      const timestamp = await getGameBlockTimestamp('stacks', 1, contractId);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][0]).toContain('extended/v1/contract/' + contractId + '/events');
      expect(fetchMock.mock.calls[1][0]).toContain('extended/v1/tx/0xTx123');
      expect(timestamp).toBe(1681000000 * 1000);

      // Verify Stacks cache
      const cachedTimestamp = await getGameBlockTimestamp('stacks', 1, contractId);
      expect(fetchMock).toHaveBeenCalledTimes(2); // No new fetch
      expect(cachedTimestamp).toBe(1681000000 * 1000);
    });

    it('should require contractId for Stacks timestamp resolution', async () => {
      const timestamp = await getGameBlockTimestamp('stacks', 1);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
