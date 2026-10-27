import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {renderHome,renderCategories,readSite} from './category-preview/render.mjs';
const context=vm.createContext({console});
vm.runInContext(await readFile(new URL('../assets/js/blog-model.js',import.meta.url),'utf8'),context);
const model=context.KasilBlog, sample=JSON.parse(await readFile(new URL('../_data/blog_ui.json',import.meta.url),'utf8')).settings;
const copy=()=>JSON.parse(JSON.stringify(sample));

function nested() {
  const config=model.normalize(copy());
  config.tabs.push({id:'unity',title:'Unity',parent:'',categories:[],show_top:true,show_side:true});
  for(const id of ['unity-practice','unity-template'])config.tabs.find(tab=>tab.id===id).parent='unity';
  return config;
}
test('parent includes descendants once, child stays scoped, nested links survive renaming',()=>{
  const config=nested(),posts=[{categories:['Unity 실습','Unity 템플릿']},{categories:['Unity 템플릿']},{categories:['Blender']}];
  config.tabs.push({id:'lighting',title:'조명',parent:'unity-practice',categories:['조명']});
  posts.push({categories:['조명']});
  const parent=model.groupedTab(config,model.selectTab(config,'unity'));
  assert.equal(model.filterPosts(posts,parent).length,3);
  assert.equal(model.filterPosts(posts,model.groupedTab(config,model.selectTab(config,'unity-practice'))).length,2);
  assert.equal(model.tabLabel(config.tabs,'lighting'),'Unity › Unity 실습 › 조명');
  const tree=Array.from(model.hierarchy(config.tabs)).map(({tab,depth})=>[tab.id,depth]);
  assert.deepEqual(tree.slice(-4),[['unity',0],['unity-practice',1],['lighting',2],['unity-template',1]]);
  config.tabs.find(tab=>tab.id==='unity').title='유니티';
  assert.equal(model.selectTab(config,'lighting').parent,'unity-practice');
});
test('hierarchy validation rejects missing parents, self parents and cycles; sibling names are unique',()=>{
  const config=nested();assert.equal(model.validate(config),'');
  const parent=config.tabs.find(tab=>tab.id==='unity');
  parent.parent='missing';assert.match(model.validate(config),/존재/);
  parent.parent='unity';assert.match(model.validate(config),/자기 자신/);
  parent.parent='unity-template';assert.match(model.validate(config),/자기 자신/);
  parent.parent='';config.tabs.find(tab=>tab.id==='unity-template').title='Unity 실습';assert.match(model.validate(config),/같은 상위/);
  config.tabs.find(tab=>tab.id==='unity-template').parent='blender';assert.equal(model.validate(config),'');
  assert.equal(model.normalize(sample).tabs[0].parent,'');
});
test('tag filter matches only tags, combines text and category, and tolerates hash/case/empty tags',()=>{
  const posts=[{title:'Unity 조명',categories:['Unity 실습'],tags:['URP','Lighting']},{title:'Lighting',categories:['Unity 실습'],tags:[]},{title:'Blender 조명',categories:['Blender'],tags:['Lighting']}];
  assert.equal(model.filterPosts(posts,{all:true},'','#light').length,2);
  assert.equal(model.filterPosts(posts,{categories:['Unity 실습']},'조명',' #LIGHTING ').length,1);
  assert.equal(model.filterPosts(posts,{all:true},'','조명').length,0);
  assert.equal(model.filterPosts(posts,{all:true},'','').length,3);
});
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
  assert.ok(html.includes('/Kasil_DevLog/admin/#/collections/posts/entries/2026-10-27-261027ncai_'));
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
  value=nested();control.state.selected='unity';control.addTab('unity');
  assert.equal(control.selected().parent,'unity');assert.equal(control.selected().show_top,false);
  control.changeTab({title:'고급 실습'});control.moveTab(-1);
  assert.equal(model.hierarchy(value.tabs).at(-1).tab.id,'unity-template');
  control.state.selected='unity';control.removeTab();
  assert.equal(value.tabs.find(tab=>tab.id==='unity-practice').parent,'');
  assert.equal(value.tabs.find(tab=>tab.id==='unity-template').categories[0],'Unity 템플릿');
  assert.equal(control.isValid(),true);
});
