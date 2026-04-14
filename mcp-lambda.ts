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

  const eventHeaders = Object.fromEntries(
    Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );

  // Construire les headers MCP explicitement pour éviter les conflits de
  // content-type qu'undici peut introduire avec les bodies string.
  const requestHeaders = new Headers({
    'content-type': 'application/json',
    'accept': eventHeaders['accept'] ?? 'application/json, text/event-stream',
  });
  // Passer les headers de protocole MCP si présents
  for (const h of ['mcp-session-id', 'last-event-id', 'mcp-protocol-version']) {
    if (eventHeaders[h]) requestHeaders.set(h, eventHeaders[h]);
  }

  // Utiliser un Blob pour éviter que le body string n'écrase le content-type
  const bodyInit = (method !== 'GET' && method !== 'HEAD' && bodyRaw)
    ? new Blob([bodyRaw], { type: 'application/json' })
    : undefined;

  const request = new Request('https://dyscolor.mcp/mcp', {
    method,
    headers: requestHeaders,
    body: bodyInit,
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
