import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { callApi } from './api.js';
import { formatToolResult } from '../types.js';

const PriceSnapshotInputSchema = z.object({
    ticker: z
      .string()
      .describe("The stock ticker symbol (e.g., 'AAPL' for Apple)."),
});

export const getPriceSnapshot = new DynamicStructuredTool({
    name: 'get_price_snapshot',
    description: `Fetches the most recent price snapshot for a stock including latest price, volume, and OHLC data.`,
    schema: PriceSnapshotInputSchema,
    func: async (input) => {
          const { data, url } = await callApi('/quote', { symbol: input.ticker });
          // FMP returns array, take first item
      const snapshot = Array.isArray(data) ? data[0] : data;
          return formatToolResult({ snapshot }, [url]);
    },
});

const PricesInputSchema = z.object({
    ticker: z
      .string()
      .describe("The stock ticker symbol (e.g., 'AAPL' for Apple)."),
    start_date: z.string().describe('Start date in YYYY-MM-DD format.'),
    end_date: z.string().describe('End date in YYYY-MM-DD format.'),
});

export const getPrices = new DynamicStructuredTool({
    name: 'get_prices',
    description: `Retrieves historical daily price data for a stock over a date range, including OHLC prices and volume.`,
    schema: PricesInputSchema,
    func: async (input) => {
          const { data, url } = await callApi('/historical-price-eod/full', {
                  symbol: input.ticker,
                  from: input.start_date,
                  to: input.end_date,
          });
          // FMP returns { symbol, historical: [...] }
      const prices = (data as any).historical || data;
          return formatToolResult({ prices }, [url]);
    },
});
