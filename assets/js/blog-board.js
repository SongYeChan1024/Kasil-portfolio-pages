(function () {
  'use strict';
  const board=document.querySelector('.blog-board');
  if (!board || !window.KasilBlog) return;
  const model=window.KasilBlog, config=model.normalize(JSON.parse(document.getElementById('blog-settings').dataset.settings));
  const rows=Array.from(board.querySelectorAll('[data-blog-post]')).map((node,index)=>({node,index,title:node.querySelector('h3').textContent,summary:node.querySelector('.blog-post-summary').textContent,categories:JSON.parse(node.dataset.categories),tags:JSON.parse(node.dataset.tags),pin:node.dataset.pin==='true'}));
  rows.sort((a,b)=>Number(b.pin)-Number(a.pin)||a.index-b.index);
  rows.forEach(row=>document.getElementById('blog-posts').append(row.node));
  const search=document.getElementById('blog-filter');
  search.disabled=false;
  let selected=config.default_tab, page=1;
  function writeUrl(replace=false) {
    const url=new URL(location.href);
    url.searchParams.set('tab',selected);
    if(search.value.trim()) url.searchParams.set('q',search.value); else url.searchParams.delete('q');
    if(page>1) url.searchParams.set('page',page); else url.searchParams.delete('page');
    history[replace?'replaceState':'pushState']({},'',url);
  }
  function render() {
    const tab=model.selectTab(config,selected); selected=tab.id;
    const matches=model.filterPosts(rows,tab,search.value), result=model.pageItems(matches,page,10); page=result.page;
    const visible=new Set(result.items);
    rows.forEach(row=>{row.node.hidden=!visible.has(row);});
    board.querySelectorAll('[data-blog-tab]').forEach(link=>{
      if(link.dataset.blogTab===selected) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
    board.querySelectorAll('[data-tab-count]').forEach(node=>{const countTab=model.selectTab(config,node.dataset.tabCount);node.textContent=rows.filter(row=>model.matches(row,countTab)).length;});
    const heading=document.getElementById('blog-list-title');
    heading.replaceChildren(document.createTextNode(tab.title+' '));
    const count=document.createElement('span'); count.textContent=matches.length; heading.append(count);
    document.getElementById('blog-results-status').textContent=search.value.trim()?`‘${search.value.trim()}’ 검색 결과 ${matches.length}개`:`${tab.title} · ${matches.length}개의 글 · 최신순`;
    document.getElementById('blog-empty').hidden=matches.length>0;
    document.getElementById('blog-pages').hidden=result.pages<=1;
    document.getElementById('blog-page-label').textContent=`${page} / ${result.pages}`;
    board.querySelector('[data-page-step="-1"]').disabled=page===1;
    board.querySelector('[data-page-step="1"]').disabled=page===result.pages;
    board.querySelector('button[type="reset"]').hidden=!search.value;
  }
  function restore() {
    const params=new URLSearchParams(location.search);
    selected=model.selectTab(config,params.get('tab')).id; page=Number(params.get('page'))||1; search.value=params.get('q')||''; render();
  }
  board.querySelectorAll('[data-blog-tab]').forEach(link=>link.addEventListener('click',event=>{
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault(); selected=link.dataset.blogTab; page=1; search.value=''; render();writeUrl();
  }));
  board.querySelector('.blog-search').addEventListener('submit',event=>event.preventDefault());
  search.addEventListener('input',()=>{page=1;render();writeUrl(true);});
  board.querySelector('.blog-search').addEventListener('reset',event=>{event.preventDefault();search.value='';page=1;render();writeUrl(true);search.focus();});
  board.querySelectorAll('[data-page-step]').forEach(button=>button.addEventListener('click',()=>{page+=Number(button.dataset.pageStep);render();writeUrl();document.getElementById('blog-list-title').scrollIntoView({block:'start',behavior:'smooth'});}));
  window.addEventListener('popstate',restore);
  restore();
})();
