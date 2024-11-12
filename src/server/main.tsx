// src/server/main.tsx
import path from 'path';
import express from 'express';
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { ChunkExtractor } from '@loadable/server';
import type { Request, Response } from 'express';

const app = express();

app.use(express.static(path.join(__dirname, '../../public')));

if (process.env.NODE_ENV !== 'production') {
  const { rspack } = require('@rspack/core');
  const config = require('../../rspack.config');
  const compiler = rspack(config);
  
  const webpackDevMiddleware = require('webpack-dev-middleware');
  app.use(
    webpackDevMiddleware(compiler as any, {
      publicPath: '/dist/web',
      writeToDisk(filePath: string) {
        return /dist\/node\//.test(filePath) || /loadable-stats/.test(filePath);
      },
    })
  );
}

const nodeStats = path.resolve(
  __dirname,
  '../../public/dist/node/loadable-stats.json'
);

const webStats = path.resolve(
  __dirname,
  '../../public/dist/web/loadable-stats.json'
);

app.get('*', (req: Request, res: Response) => {
  const nodeExtractor = new ChunkExtractor({ statsFile: nodeStats });
  const { default: App } = nodeExtractor.requireEntrypoint();
  const webExtractor = new ChunkExtractor({ statsFile: webStats });
  const jsx = webExtractor.collectChunks(<App />);
  const html = ReactDOMServer.renderToString(jsx);

  res.set('content-type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        ${webExtractor.getLinkTags()}
        ${webExtractor.getStyleTags()}
      </head>
      <body>
        <div id="main">${html}</div>
        <script>console.log('html is loaded')</script>
        ${webExtractor.getScriptTags()}
        <script>console.log('html is ready')</script>
      </body>
    </html>
  `);
});

app.listen(9000, () => console.log('Server started http://localhost:9000'));