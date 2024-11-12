"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/main.tsx
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const react_1 = __importDefault(require("react"));
const ReactDOMServer = __importStar(require("react-dom/server"));
const server_1 = require("@loadable/server");
const app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
if (process.env.NODE_ENV !== 'production') {
    const { rspack } = require('@rspack/core');
    const config = require('../../rspack.config');
    const compiler = rspack(config);
    const webpackDevMiddleware = require('webpack-dev-middleware');
    app.use(webpackDevMiddleware(compiler, {
        publicPath: '/dist/web',
        writeToDisk(filePath) {
            return /dist\/node\//.test(filePath) || /loadable-stats/.test(filePath);
        },
    }));
}
const nodeStats = path_1.default.resolve(__dirname, '../../public/dist/node/loadable-stats.json');
const webStats = path_1.default.resolve(__dirname, '../../public/dist/web/loadable-stats.json');
app.get('*', (req, res) => {
    const nodeExtractor = new server_1.ChunkExtractor({ statsFile: nodeStats });
    const { default: App } = nodeExtractor.requireEntrypoint();
    const webExtractor = new server_1.ChunkExtractor({ statsFile: webStats });
    const jsx = webExtractor.collectChunks(react_1.default.createElement(App, null));
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
