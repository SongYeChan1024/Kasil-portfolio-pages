import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root,base,readSite,renderHome,renderCategories} from './render.mjs';
const remote='https://songyechan1024.github.io';
const response=await fetch(remote+base+'/');if(!response.ok)throw Error('Published theme shell unavailable');
const shell=(await response.text()).replace(/<script\b[^>]*src="[^"]*\/app\.min\.js[^"]*"[^>]*>[\s\S]*?<\/script>/gi,'');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.yml':'text/yaml; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  const requestUrl=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(requestUrl.pathname);
  try {
    const site=await readSite();
    if(requestUrl.searchParams.get('fixture')==='hierarchy') {
      const tabs=site.data.blog_ui.settings.tabs;
      tabs.push({id:'unity',title:'Unity',parent:'',all:false,categories:[],show_top:true,show_side:true});
      for(const tab of tabs)if(['unity-practice','unity-template'].includes(tab.id)){tab.parent='unity';tab.show_top=false;}
    }
    if(pathname==='/'||pathname===base+'/') {
      const content=await renderHome(site);
      const html=shell.replace(/(<main\b[^>]*>)[\s\S]*?<\/main>/i,'$1'+content+'</main>');
      res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'}).end(html);return;
    }
    if(pathname===base+'/assets/data/blog-categories.json') { res.writeHead(200,{'Content-Type':types['.json'],'Cache-Control':'no-store'}).end(await renderCategories(site));return; }
    if(pathname===base+'/admin/') {
      let fixture=await readFile(path.join(root,'tools/category-preview/manager.html'),'utf8');
      fixture=fixture.replace('__SETTINGS__',JSON.stringify(site.data.blog_ui).replace(/</g,'\\u003c'));
      res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'}).end(fixture);return;
    }
    // Only the local test backend is exposed in this preview, never the production login.
    if(pathname.endsWith('/admin/admin.js')||pathname.endsWith('/admin/config.yml')||pathname.endsWith('/admin/index.html')) {res.writeHead(404).end();return;}
    const localPath=pathname.startsWith(base+'/')?pathname.slice(base.length):pathname;
    const target=path.resolve(root,'.'+localPath);
    if(!target.startsWith(root+path.sep)||localPath.startsWith('/.')){res.writeHead(403).end();return;}
    try {const content=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(content);}
    catch {res.writeHead(302,{Location:remote+base+localPath}).end();}
  } catch(error) {console.error(error);res.writeHead(500).end('Preview render failed');}
});
server.listen(4176,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4176'+base+'/'));
