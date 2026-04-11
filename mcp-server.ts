import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { analyze } from './src/lib/analyze.js';

const server = new McpServer({ name: 'dyscolor', version: '0.1.0' });

server.tool(
  'dyscolor_analyze',
  'Analyse un texte français pour lecteurs dyslexiques. ' +
  'Retourne la structure syllabique/mot/ligne avec les couleurs associées ' +
  'et les indices des lettres muettes.',
  {
    text:       z.string().describe('Texte français à analyser'),
    mode:       z.enum(['syllabe', 'mot', 'ligne']).describe('Mode de colorisation'),
    palette:    z.enum(['doux', 'classique', 'violet']).optional().default('doux'),
    showSilent: z.boolean().optional().default(false)
      .describe('Marquer les lettres muettes'),
  },
  async ({ text, mode, palette, showSilent }) => {
    const result = analyze(text, mode, palette, showSilent);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

await server.connect(new StdioServerTransport());
