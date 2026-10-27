import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.yml':'text/yaml; charset=utf-8'};
const server=http.createServer(async (req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root, '.' + (pathname==='/' ? '/tools/editor-paste-preview.html' : pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try { const body=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(body); }
  catch {res.writeHead(404).end('Not found');}
});
server.listen(4175,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4175/'));
