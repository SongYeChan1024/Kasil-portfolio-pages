import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';
import YAML from 'yaml';
import MarkdownIt from 'markdown-it';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const base='/Kasil-portfolio-pages';
const engine=new Liquid({jekyllInclude:true}),markdown=new MarkdownIt();
engine.registerFilter('relative_url',value=>base+value);
engine.registerFilter('jsonify',value=>JSON.stringify(value??null));
engine.registerFilter('where_exp',(items)=>items.filter(post=>post.hidden!==true));
engine.registerFilter('date_to_xmlschema',value=>new Date(value).toISOString());
export async function readSite() {
  const data=JSON.parse(await readFile(path.join(root,'_data/blog_ui.json'),'utf8'));
  const posts=[];
  for(const file of await readdir(path.join(root,'_posts'))) {
    if(!file.endsWith('.md'))continue;
    const content=await readFile(path.join(root,'_posts',file),'utf8');
    const match=content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)/);if(!match)continue;
    const info=YAML.parse(match[1]);if(info.published===false||new Date(info.date)>new Date())continue;
    posts.push({...info,path:'_posts/'+file,url:'/posts/'+file.slice(11,-3)+'/',excerpt:markdown.render(match[2].split(/\r?\n\s*\r?\n/)[0]),tags:info.tags||[],categories:info.categories||[]});
  }
  posts.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const categories={};for(const post of posts)for(const category of post.categories)(categories[category]??=[]).push(post);
  return {data:{blog_ui:data},posts,categories:Object.entries(categories)};
}
export async function renderHome(site) {
  site??=await readSite();
  const template=(await readFile(path.join(root,'_layouts/home.html'),'utf8')).replace(/^---[\s\S]*?---\r?\n/,'');
  return engine.parseAndRender(template,{site});
}
export async function renderCategories(site) {
  site??=await readSite();
  const template=(await readFile(path.join(root,'assets/data/blog-categories.json'),'utf8')).replace(/^---[\s\S]*?---\r?\n/,'');
  return engine.parseAndRender(template,{site});
}
