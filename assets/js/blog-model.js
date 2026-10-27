(function (root) {
  'use strict';
  const blank = {title:'Kasil Devlog',tagline:'',nickname:'카실',bio:'',profile_image:'',banner_image:'',accent:'violet',default_tab:'all',tabs:[{id:'all',title:'전체 글',all:true,categories:[],show_top:true,show_side:true}]};
  function plain(value) { return value?.toJS ? value.toJS() : value; }
  function normalize(value) {
    const source = plain(value) || {};
    return { ...blank, ...source, tabs:(source.tabs || blank.tabs).map(tab=>({categories:[],all:false,show_top:true,show_side:true,...tab,parent:tab.parent||''})) };
  }
  function ancestors(tabs, id) {
    const path=[],seen=new Set([id]);let tab=tabs.find(item=>item.id===id);
    while(tab?.parent) {
      tab=tabs.find(item=>item.id===tab.parent);
      if(!tab||seen.has(tab.id))break;
      seen.add(tab.id);path.unshift(tab);
    }
    return path;
  }
  function subtree(tabs, id) { return tabs.filter(tab=>tab.id===id||ancestors(tabs,tab.id).some(parent=>parent.id===id)); }
  function hierarchy(tabs) {
    const result=[],seen=new Set();
    function visit(tab,depth) {
      if(seen.has(tab.id))return;
      seen.add(tab.id);result.push({tab,depth});
      tabs.filter(child=>child.parent===tab.id).forEach(child=>visit(child,depth+1));
    }
    tabs.filter(tab=>!tab.parent||!tabs.some(parent=>parent.id===tab.parent)).forEach(tab=>visit(tab,0));
    tabs.forEach(tab=>visit(tab,0)); // Keep malformed imported menus visible so they can be repaired.
    return result;
  }
  function tabLabel(tabs, id) { return [...ancestors(tabs,id),tabs.find(tab=>tab.id===id)].filter(Boolean).map(tab=>tab.title).join(' › '); }
  function groupedTab(config, tab) {
    const group=subtree(config.tabs,tab.id);
    return {...tab,all:group.some(item=>item.all),categories:Array.from(new Set(group.flatMap(item=>item.categories)))};
  }
  function validate(value) {
    const config = normalize(value), ids = new Set(), titles = new Set();
    if (!String(config.title).trim()) return '블로그 이름을 입력해 주세요.';
    if (!['violet','blue','green'].includes(config.accent)) return '강조 색상을 선택해 주세요.';
    if (!config.tabs.length) return '메뉴를 하나 이상 남겨 주세요.';
    for (const tab of config.tabs) {
      if (!tab.id || ids.has(tab.id)) return '메뉴 식별자가 중복되었습니다. 해당 메뉴를 다시 추가해 주세요.';
      const title = String(tab.title || '').trim();
      if (!title) return '모든 메뉴에 이름을 입력해 주세요.';
      const siblingTitle=JSON.stringify([tab.parent,title]);
      if (titles.has(siblingTitle)) return '같은 상위 카테고리 안에서는 메뉴 이름을 다르게 입력해 주세요.';
      if (!Array.isArray(tab.categories)) return '메뉴의 카테고리를 다시 선택해 주세요.';
      if (tab.parent && !config.tabs.some(parent=>parent.id===tab.parent)) return '존재하는 상위 카테고리를 선택해 주세요.';
      const seen=new Set([tab.id]);let parent=tab.parent;
      while(parent) {
        if(seen.has(parent))return '자기 자신이나 하위 카테고리를 상위로 지정할 수 없습니다.';
        seen.add(parent);parent=config.tabs.find(item=>item.id===parent)?.parent;
      }
      ids.add(tab.id); titles.add(siblingTitle);
    }
    if (!config.tabs.some(tab=>tab.show_top || tab.show_side)) return '상단이나 오른쪽에 표시할 메뉴를 하나 이상 선택해 주세요.';
    if (!config.tabs.some(tab=>tab.id===config.default_tab && (tab.show_top || tab.show_side))) return '표시 중인 메뉴를 첫 화면으로 선택해 주세요.';
    for (const key of ['profile_image','banner_image']) {
      if (config[key] && !/^(https?:\/\/|\/(?!\/))/.test(config[key])) return '이미지는 업로드하거나 https 주소를 입력해 주세요.';
    }
    return '';
  }
  function matches(post, tab) { return !!tab.all || tab.categories.some(category=>(post.categories || []).includes(category)); }
  function tagTerm(value) { return String(value).trim().replace(/^#+/,'').trim().toLocaleLowerCase('ko'); }
  function filterPosts(posts, tab, query='', tagQuery='') {
    const term=query.trim().toLocaleLowerCase('ko'),tag=tagTerm(tagQuery);
    return posts.filter(post=>matches(post,tab) && (!term || [post.title,post.summary,...(post.tags||[])].join(' ').toLocaleLowerCase('ko').includes(term)) && (!tag || (post.tags||[]).some(value=>tagTerm(value).includes(tag))));
  }
  function selectTab(config, id) {
    return config.tabs.find(tab=>tab.id===id) || config.tabs.find(tab=>tab.id===config.default_tab) || config.tabs[0] || blank.tabs[0];
  }
  function pageItems(items, page, size=10) {
    const pages=Math.max(1,Math.ceil(items.length/size));
    const current=Math.min(pages,Math.max(1,Number.isFinite(Number(page))?Math.floor(Number(page)):1));
    return {items:items.slice((current-1)*size,current*size),page:current,pages};
  }
  root.KasilBlog={normalize,validate,matches,filterPosts,selectTab,pageItems,ancestors,subtree,hierarchy,tabLabel,groupedTab,tagTerm};
})(typeof window==='undefined'?globalThis:window);
