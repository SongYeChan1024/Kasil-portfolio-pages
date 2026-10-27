(function () {
  'use strict';
  const board=document.querySelector('.blog-board');
  if (!board || !window.KasilBlog) return;
  const model=window.KasilBlog, config=model.normalize(JSON.parse(document.getElementById('blog-settings').dataset.settings));
  const rows=Array.from(board.querySelectorAll('[data-blog-post]')).map((node,index)=>({node,index,title:node.querySelector('h3').textContent,summary:node.querySelector('.blog-post-summary').textContent,categories:JSON.parse(node.dataset.categories),tags:JSON.parse(node.dataset.tags),pin:node.dataset.pin==='true'}));
  rows.sort((a,b)=>Number(b.pin)-Number(a.pin)||a.index-b.index);
  rows.forEach(row=>document.getElementById('blog-posts').append(row.node));
  const search=document.getElementById('blog-filter'),tagSearch=document.getElementById('blog-tag-filter');
  search.disabled=false;tagSearch.disabled=false;
  const groups=new Map(config.tabs.map(tab=>[tab.id,model.groupedTab(config,tab)]));
  const branches=new Map();
  function tabLink(tab,top=false) {
    const link=document.createElement('a'),title=document.createElement('span'),count=document.createElement('span');
    link.dataset.blogTab=tab.id;link.href=board.dataset.home+'?tab='+encodeURIComponent(tab.id);
    if(top)link.className='blog-tab';
    title.textContent=top?model.tabLabel(config.tabs,tab.id):tab.title;
    count.dataset.tabCount=tab.id;count.className='blog-category-count';
    link.append(title,count);return link;
  }
  const tree=model.hierarchy(config.tabs),topNav=board.querySelector('.blog-top-tabs'),sideNav=board.querySelector('.blog-category-panel nav');
  topNav.replaceChildren(...tree.filter(({tab})=>tab.show_top).map(({tab})=>tabLink(tab,true)));
  const sideTabs=tree.filter(({tab})=>tab.show_side).map(({tab})=>({tab,parent:model.ancestors(config.tabs,tab.id).filter(parent=>parent.show_side).at(-1)?.id||''}));
  let branchNumber=0;
  function sideTree(parent) {
    const list=document.createElement('ul');list.className='blog-category-tree';
    sideTabs.filter(item=>item.parent===parent).forEach(({tab})=>{
      const item=document.createElement('li'),row=document.createElement('div');row.className='blog-category-row';
      row.append(tabLink(tab));item.append(row);
      if(sideTabs.some(child=>child.parent===tab.id)) {
        const children=sideTree(tab.id),toggle=document.createElement('button');children.id='blog-branch-'+(++branchNumber);
        toggle.type='button';toggle.className='blog-category-toggle';toggle.textContent='▾';toggle.setAttribute('aria-controls',children.id);
        const setOpen=open=>{children.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',tab.title+' 하위 카테고리 '+(open?'접기':'펼치기'));toggle.textContent=open?'▾':'▸';};
        setOpen(true);toggle.addEventListener('click',()=>setOpen(children.hidden));
        branches.set(tab.id,setOpen);row.prepend(toggle);item.append(children);
      }
      list.append(item);
    });return list;
  }
  sideNav.replaceChildren(sideTree(''));
  function tagOptions(tab) {
    const tags=Array.from(new Set(rows.filter(row=>model.matches(row,tab)).flatMap(row=>row.tags))).sort((a,b)=>a.localeCompare(b,'ko'));
    document.getElementById('blog-tag-options').replaceChildren(...tags.map(tag=>{const option=document.createElement('option');option.value=tag;return option;}));
  }
  let selected=config.default_tab, page=1;
  function writeUrl(replace=false) {
    const url=new URL(location.href);
    url.searchParams.set('tab',selected);
    if(search.value.trim()) url.searchParams.set('q',search.value); else url.searchParams.delete('q');
    if(tagSearch.value.trim()) url.searchParams.set('tag',tagSearch.value); else url.searchParams.delete('tag');
    if(page>1) url.searchParams.set('page',page); else url.searchParams.delete('page');
    history[replace?'replaceState':'pushState']({},'',url);
  }
  function render() {
    const tab=model.selectTab(config,selected); selected=tab.id;
    const group=groups.get(tab.id),label=model.tabLabel(config.tabs,tab.id);
    const matches=model.filterPosts(rows,group,search.value,tagSearch.value), result=model.pageItems(matches,page,10); page=result.page;
    model.ancestors(config.tabs,selected).forEach(parent=>branches.get(parent.id)?.(true));
    tagOptions(group);
    const visible=new Set(result.items);
    rows.forEach(row=>{row.node.hidden=!visible.has(row);});
    board.querySelectorAll('[data-blog-tab]').forEach(link=>{
      if(link.dataset.blogTab===selected) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
    board.querySelectorAll('[data-tab-count]').forEach(node=>{node.textContent=rows.filter(row=>model.matches(row,groups.get(node.dataset.tabCount))).length;});
    const heading=document.getElementById('blog-list-title');
    heading.replaceChildren(document.createTextNode(label+' '));
    const count=document.createElement('span'); count.textContent=matches.length; heading.append(count);
    const filters=[search.value.trim()?`‘${search.value.trim()}’`:null,model.tagTerm(tagSearch.value)?`#${model.tagTerm(tagSearch.value)}`:null].filter(Boolean);
    document.getElementById('blog-results-status').textContent=`${label} · ${filters.length?filters.join(' + ')+' 검색 결과 ':''}${matches.length}개의 글 · 최신순`;
    document.getElementById('blog-empty').hidden=matches.length>0;
    document.getElementById('blog-pages').hidden=result.pages<=1;
    document.getElementById('blog-page-label').textContent=`${page} / ${result.pages}`;
    board.querySelector('[data-page-step="-1"]').disabled=page===1;
    board.querySelector('[data-page-step="1"]').disabled=page===result.pages;
    board.querySelector('button[type="reset"]').hidden=!search.value;
    board.querySelector('[data-clear-tag]').hidden=!tagSearch.value;
  }
  function restore() {
    const params=new URLSearchParams(location.search);
    selected=model.selectTab(config,params.get('tab')).id; page=Number(params.get('page'))||1; search.value=params.get('q')||'';tagSearch.value=params.get('tag')||''; render();
  }
  board.querySelectorAll('[data-blog-tab]').forEach(link=>link.addEventListener('click',event=>{
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault(); selected=link.dataset.blogTab; page=1; search.value=''; render();writeUrl();
  }));
  board.querySelector('.blog-search').addEventListener('submit',event=>event.preventDefault());
  search.addEventListener('input',()=>{page=1;render();writeUrl(true);});
  tagSearch.addEventListener('input',()=>{page=1;render();writeUrl(true);});
  board.querySelector('[data-clear-tag]').addEventListener('click',()=>{tagSearch.value='';page=1;render();writeUrl();tagSearch.focus();});
  board.querySelectorAll('[data-blog-tag]').forEach(button=>button.addEventListener('click',()=>{tagSearch.value=button.dataset.blogTag;search.value='';page=1;render();writeUrl();document.getElementById('blog-list-title').scrollIntoView({block:'start',behavior:'smooth'});}));
  board.querySelector('.blog-search').addEventListener('reset',event=>{event.preventDefault();search.value='';page=1;render();writeUrl(true);search.focus();});
  board.querySelectorAll('[data-page-step]').forEach(button=>button.addEventListener('click',()=>{page+=Number(button.dataset.pageStep);render();writeUrl();document.getElementById('blog-list-title').scrollIntoView({block:'start',behavior:'smooth'});}));
  window.addEventListener('popstate',restore);
  restore();
})();
