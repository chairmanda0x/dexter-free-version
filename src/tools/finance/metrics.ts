import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { callApi } from './api.js';
import { formatToolResult } from '../types.js';

const FinancialMetricsSnapshotInputSchema = z.object({
    ticker: z
      .string()
      .describe("The stock ticker symbol (e.g., 'AAPL' for Apple)."),
});

export const getFinancialMetricsSnapshot = new DynamicStructuredTool({
    name: 'get_financial_metrics_snapshot',
    description: `Fetches current financial metrics including market cap, P/E ratio, dividend yield, etc.`,
    schema: FinancialMetricsSnapshotInputSchema,
    func: async (input) => {
          const { data, url } = await callApi('/key-metrics-ttm', { symbol: input.ticker });
          const snapshot = Array.isArray(data) ? data[0] : data;
          return formatToolResult({ snapshot }, [url]);
    },
});

const FinancialMetricsInputSchema = z.object({
    ticker: z
      .string()
      .describe("The stock ticker symbol (e.g., 'AAPL' for Apple)."),
    period: z
      .enum(['annual', 'quarterly', 'ttm'])
      .default('ttm')
      .describe("The reporting period: 'annual', 'quarterly', or 'ttm'."),
    limit: z
      .number()
      .default(4)
      .describe('Number of periods to retrieve.'),
});

function mapPeriod(period: string): string {
    if (period === 'quarterly') return 'quarter';
    return 'annual';
}

export const getFinancialMetrics = new DynamicStructuredTool({
    name: 'get_financial_metrics',
    description: `Retrieves historical financial metrics like P/E ratio, enterprise value, etc.`,
    schema: FinancialMetricsInputSchema,
    func: async (input) => {
          const { data, url } = await callApi('/key-metrics', {
                  symbol: input.ticker,
                  period: mapPeriod(input.period),
                  limit: input.limit,
          });
          return formatToolResult({ financial_metrics: data }, [url]);
    },
});
