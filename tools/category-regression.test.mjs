import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {renderHome,renderCategories,readSite} from './category-preview/render.mjs';
const context=vm.createContext({console});
vm.runInContext(await readFile(new URL('../assets/js/blog-model.js',import.meta.url),'utf8'),context);
const model=context.KasilBlog, sample=JSON.parse(await readFile(new URL('../_data/blog_ui.json',import.meta.url),'utf8')).settings;
const copy=()=>JSON.parse(JSON.stringify(sample));
test('grouped categories form a union without duplicating posts; empty menu stays empty',()=>{
  const posts=[{categories:['Unity 실습','Unity 템플릿']},{categories:['Unity 실습']},{categories:['Blender']}];
  assert.equal(model.filterPosts(posts,{categories:['Unity 실습','Unity 템플릿']}).length,2);
  assert.equal(model.filterPosts(posts,{categories:[]}).length,0);
  assert.equal(model.filterPosts(posts,{all:true,categories:[]}).length,3);
});
test('search stays within the active category; Korean titles and tags are searchable',()=>{
  const posts=[{title:'조명 실습',categories:['Unity 실습'],tags:['LIGHT']},{title:'조명 실습',categories:['Blender']}];
  assert.equal(model.filterPosts(posts,{categories:['Unity 실습']},'조명').length,1);
  assert.equal(model.filterPosts(posts,{all:true,categories:[]},'light').length,1);
});
test('pagination includes older posts and clamps invalid page numbers after filtering',()=>{
  const posts=Array.from({length:23},(_,index)=>index);
  assert.equal(model.pageItems(posts,3).items[0],20);
  assert.equal(model.pageItems(posts,900).page,3);
  assert.equal(model.pageItems(posts,-1).page,1);
  assert.equal(model.pageItems([],2).page,1);
});
test('renaming a tab preserves existing links and unknown ids use the selected default',()=>{
  const config=copy();config.tabs[1].title='블렌더 수업';config.default_tab='blender';
  assert.equal(model.selectTab(config,'blender').title,'블렌더 수업');
  assert.equal(model.selectTab(config,'unknown').id,'blender');
});
test('validation prevents empty or duplicate menu names and hidden default menus',()=>{
  assert.equal(model.validate(copy()),'');
  const duplicate=copy();duplicate.tabs[1].title='전체 글';assert.ok(model.validate(duplicate));
  duplicate.tabs[1].title='  ';assert.ok(model.validate(duplicate));
  const hidden=copy();hidden.tabs[0].show_top=false;hidden.tabs[0].show_side=false;assert.ok(model.validate(hidden));
  const image=copy();image.banner_image='javascript:alert(1)';assert.ok(model.validate(image));
});
test('actual home template keeps all public posts, correct edit filenames, and right sidebar after list',async()=>{
  const site=await readSite(), html=await renderHome(site);
  assert.equal((html.match(/<li data-blog-post/g)||[]).length,site.posts.length);
  assert.ok(html.indexOf('class="blog-right"')>html.indexOf('id="blog-posts"'));
  assert.ok(html.includes('/Kasil-portfolio-pages/admin/#/collections/posts/entries/2026-10-27-261027ncai_'));
  assert.ok(html.includes('?tab=blender'));
  assert.ok(!html.includes('src=""'));
});
test('template safely embeds settings and skips hidden posts/category counts',async()=>{
  const site=await readSite();site.data.blog_ui.settings.title='</script><img src=x onerror=alert(1)>';
  site.posts.push({hidden:true,title:'HIDDEN',categories:['Secret'],tags:[],date:'2026-01-01',url:'/secret/',path:'_posts/secret.md'});
  site.categories.push(['Secret',[site.posts.at(-1)]]);
  const html=await renderHome(site);
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  const encoded=html.match(/id="blog-settings" data-settings="([^"]*)"/)[1];
  const data=encoded.replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code))).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  assert.equal(JSON.parse(data).title,site.data.blog_ui.settings.title);
  assert.ok(!html.includes('HIDDEN'));
  const categories=JSON.parse(await renderCategories(site));assert.ok(!categories.categories.some(item=>item.name==='Secret'));
});
test('menu editor preserves categories on rename/reorder and chooses a visible default when hidden',async()=>{
  let definition;
  const local={KasilBlog:model,crypto:{randomUUID:()=> 'test-id'}};
  vm.runInNewContext(await readFile(new URL('../admin/blog-manager.js',import.meta.url),'utf8'),{window:local});
  local.KasilBlogManager.register({registerWidget(value){assert.equal(value.allowMapValue,true);}},value=>{definition=value;return value;},()=>{});
  let value=copy();
  const control={...definition,props:{get value(){return value;},onChange(next){value=next;}},state:{selected:'blender'},setState(patch,done){Object.assign(this.state,patch);done?.();}};
  control.changeTab({title:'블렌더 수업'});assert.equal(value.tabs[1].id,'blender');assert.equal(value.tabs[1].categories[0],'Blender');
  control.moveTab(-1);assert.equal(value.tabs[0].id,'blender');
  value.default_tab='blender';control.changeTab({show_top:false,show_side:false});assert.equal(value.default_tab,'all');
  control.addTab();assert.equal(value.tabs.at(-1).categories.length,0);assert.equal(value.tabs.at(-1).all,false);
  control.removeTab();assert.equal(value.tabs.length,sample.tabs.length);assert.equal(control.isValid(),true);
});
