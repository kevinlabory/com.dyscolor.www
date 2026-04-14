import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { analyze } from './src/lib/analyze.js';

const MAX_TEXT_LENGTH = 50_000;

export const handler = async (event: {
  httpMethod?: string;
  requestContext?: { http?: { method?: string } };
  headers?: Record<string, string>;
  body?: string | null;
  isBase64Encoded?: boolean;
}): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> => {

  // ── Auth ──────────────────────────────────────────────────────────────────
  const apiKey = process.env.MCP_API_KEY;
  if (apiKey) {
    const auth = event.headers?.['authorization'] ?? event.headers?.['Authorization'] ?? '';
    if (auth !== `Bearer ${apiKey}`) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
  }

  // ── Adapt Lambda event → Web Standard Request ─────────────────────────────
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'POST';
  const bodyRaw = event.isBase64Encoded && event.body
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : (event.body ?? '');

  const headers = new Headers(
    Object.fromEntries(
      Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])
    )
  );
  // Lambda Function URLs don't send a real URL — provide a placeholder
  const request = new Request('https://dyscolor.mcp/mcp', {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' ? bodyRaw : undefined,
  });

  // ── MCP server (one per invocation — stateless) ───────────────────────────
  const server = new McpServer({ name: 'dyscolor', version: '0.1.0' });

  server.tool(
    'dyscolor_analyze',
    'Analyse un texte français pour lecteurs dyslexiques. ' +
    'Retourne la structure syllabique/mot/ligne avec les couleurs associées ' +
    'et les indices des lettres muettes.',
    {
      text:       z.string().max(MAX_TEXT_LENGTH).describe('Texte français à analyser'),
      mode:       z.enum(['syllabe', 'mot', 'ligne']).describe('Mode de colorisation'),
      palette:    z.enum(['doux', 'classique', 'violet']).optional().default('doux'),
      showSilent: z.boolean().optional().default(true).describe('Marquer les lettres muettes'),
    },
    async ({ text, mode, palette, showSilent }) => {
      const result = analyze(text, mode, palette, showSilent);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,      // JSON pur, pas de SSE
  });

  await server.connect(transport);
  const response = await transport.handleRequest(request);

  // ── Adapt Web Standard Response → Lambda response ─────────────────────────
  const responseBody = await response.text();
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => { responseHeaders[key] = value; });

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: responseBody,
  };
};
