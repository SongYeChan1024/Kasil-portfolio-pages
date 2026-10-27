(function(root) {
  'use strict';
  function register(CMS, createClass, h) {
    const model=root.KasilBlog;
    const Control=createClass({
      getInitialState() { return {section:'menus',selected:'',categories:[],categoryError:'',newCategory:'',notice:''}; },
      componentDidMount() {
        this.abort=new AbortController();
        fetch(this.props.field.get('categories_url'),{cache:'no-store',signal:this.abort.signal})
          .then(response=>{if(!response.ok)throw Error();return response.json();})
          .then(data=>this.setState({categories:data.categories}))
          .catch(error=>{if(error.name!=='AbortError')this.setState({categoryError:'카테고리 목록을 가져오지 못했습니다. 아래에서 이름을 직접 추가할 수 있습니다.'});});
      },
      componentWillUnmount() { this.abort.abort(); },
      config() { return model.normalize(this.props.value); },
      isValid() { const error=model.validate(this.config());return error?{error:{message:error}}:true; },
      change(patch) { this.props.onChange({...this.config(),...patch}); },
      selected() { const config=this.config();return config.tabs.find(tab=>tab.id===this.state.selected)||config.tabs[0]; },
      changeTab(patch) {
        const config=this.config(), selected=this.selected();
        const tabs=config.tabs.map(tab=>tab.id===selected.id?{...tab,...patch}:tab);
        const current=tabs.find(tab=>tab.id===config.default_tab);
        this.change({tabs,default_tab:current&&(current.show_top||current.show_side)?current.id:(tabs.find(tab=>tab.show_top||tab.show_side)?.id||'')});
      },
      addTab() {
        const config=this.config();let number=1;while(config.tabs.some(tab=>tab.title==='새 메뉴 '+number))number++;
        const tab={id:'tab-'+root.crypto.randomUUID(),title:'새 메뉴 '+number,all:false,categories:[],show_top:true,show_side:true};
        this.change({tabs:[...config.tabs,tab]});this.setState({selected:tab.id,notice:'새 메뉴를 추가했습니다. 아래에서 이름과 포함할 카테고리를 정해 주세요.'});
      },
      moveTab(step) {
        const tabs=this.config().tabs.slice(),index=tabs.findIndex(tab=>tab.id===this.selected().id),next=index+step;
        if(next<0||next>=tabs.length)return;[tabs[index],tabs[next]]=[tabs[next],tabs[index]];this.change({tabs});
      },
      removeTab() {
        const config=this.config(), selected=this.selected();
        if(config.tabs.length<=1)return;
        const tabs=config.tabs.filter(tab=>tab.id!==selected.id);
        this.change({tabs,default_tab:config.default_tab===selected.id?(tabs.find(tab=>tab.show_top||tab.show_side)?.id||''):config.default_tab});
        this.setState({selected:tabs[0].id,notice:'메뉴만 제외했습니다. 게시글과 원래 카테고리는 그대로 있습니다.'});
      },
      addCategory(name) {
        const selected=this.selected(), category=name.trim();if(!category||selected.categories.includes(category))return;
        this.changeTab({categories:[...selected.categories,category]});this.setState({newCategory:''});
      },
      field(label,key,multiline=false) {
        const config=this.config(),id='blog-manager-'+key;
        return h('div',{className:'bm-field',key},h('label',{htmlFor:id},label),h(multiline?'textarea':'input',{id,value:config[key]||'',rows:3,maxLength:multiline?500:120,onChange:event=>this.change({[key]:event.target.value})}));
      },
      imageField(label,key) {
        const field=this.props.field.set('widget','image').set('name',key).set('required',false);
        return h('div',{className:'bm-field',key},h('label',null,label),h(CMS.getWidget('image').control,{...this.props,field,forID:'bm-'+key,value:this.config()[key],onChange:value=>this.change({[key]:value||''})}));
      },
      renderMenus() {
        const config=this.config(),selected=this.selected(),index=config.tabs.indexOf(selected);
        const categories=Array.from(new Set([...this.state.categories.map(item=>item.name),...config.tabs.flatMap(tab=>tab.categories)])).sort((a,b)=>a.localeCompare(b,'ko'));
        return h('div',null,
          h('div',{className:'bm-section-heading'},h('div',null,h('h2',null,'카테고리 · 메뉴 설정'),h('p',null,'상단 탭과 오른쪽 카테고리를 직접 구성하세요.')),h('button',{type:'button',className:'bm-primary',onClick:this.addTab},'＋ 메뉴 추가')),
          h('p',{className:'bm-help'},'메뉴를 선택한 뒤 이름과 포함할 카테고리를 바꾸세요. 여러 카테고리를 묶으면 해당 글을 한 목록에서 볼 수 있습니다.'),
          h('div',{className:'bm-table-wrap'},h('table',{className:'bm-table'},h('thead',null,h('tr',null,h('th',null,'메뉴 이름'),h('th',null,'상단 탭'),h('th',null,'오른쪽'),h('th',null,'첫 화면'),h('th',null,'포함한 카테고리'))),
            h('tbody',null,config.tabs.map(tab=>h('tr',{key:tab.id,'data-selected':selected?.id===tab.id},
              h('td',null,h('button',{type:'button',className:'bm-row-select','aria-pressed':selected?.id===tab.id,onClick:()=>this.setState({selected:tab.id})},tab.title||'이름 없는 메뉴')),
              ...['show_top','show_side'].map((key,i)=>h('td',{key},h('input',{type:'checkbox','aria-label':tab.title+(i===0?' 상단 탭':' 오른쪽'),checked:tab[key],onChange:event=>{const checked=event.target.checked;this.setState({selected:tab.id},()=>this.changeTab({[key]:checked}));}}))),
              h('td',null,h('input',{type:'radio',name:'default-blog-tab','aria-label':tab.title+' 첫 화면',checked:config.default_tab===tab.id,disabled:!tab.show_top&&!tab.show_side,onChange:()=>this.change({default_tab:tab.id})})),
              h('td',null,tab.all?'모든 카테고리':tab.categories.join(', ')||'아직 선택하지 않음')))))),
          selected?h('section',{className:'bm-menu-detail','aria-label':'선택한 메뉴 설정'},
            h('div',{className:'bm-detail-heading'},h('h3',null,'선택한 메뉴'),h('div',{className:'bm-actions'},h('button',{type:'button',disabled:index===0,onClick:()=>this.moveTab(-1)},'↑ 위로'),h('button',{type:'button',disabled:index===config.tabs.length-1,onClick:()=>this.moveTab(1)},'↓ 아래로'),h('button',{type:'button',disabled:config.tabs.length===1,onClick:this.removeTab},'메뉴 제외'))),
            h('div',{className:'bm-inline-field'},h('label',{htmlFor:'bm-menu-name'},'메뉴 이름'),h('input',{id:'bm-menu-name',value:selected.title,maxLength:40,onChange:event=>this.changeTab({title:event.target.value})})),
            h('label',{className:'bm-check'},h('input',{type:'checkbox',checked:selected.all,onChange:event=>this.changeTab({all:event.target.checked})}),'모든 카테고리의 글 표시'),
            !selected.all?h('div',null,
              h('div',{className:'bm-category-picker'},h('div',null,h('h4',null,'사용 가능한 카테고리'),h('ul',null,categories.map(name=>h('li',{key:name},h('button',{type:'button',disabled:selected.categories.includes(name),onClick:()=>this.addCategory(name)},h('span',null,name),h('span',null,selected.categories.includes(name)?'선택됨':'추가 →')))))),
                h('div',null,h('h4',null,'이 메뉴에 포함한 카테고리'),h('ul',null,selected.categories.length?selected.categories.map(name=>h('li',{key:name},h('span',null,name),h('button',{type:'button','aria-label':name+' 제외',onClick:()=>this.changeTab({categories:selected.categories.filter(item=>item!==name)})},'제외'))):h('li',{className:'bm-empty'},'왼쪽에서 카테고리를 추가하세요.')))),
              this.state.categoryError?h('p',{role:'status',className:'bm-help'},this.state.categoryError):null,
              h('div',{className:'bm-add-category'},h('label',{htmlFor:'bm-new-category'},'카테고리 이름 직접 입력'),h('input',{id:'bm-new-category',placeholder:'글에 지정한 카테고리 이름',value:this.state.newCategory,onChange:event=>this.setState({newCategory:event.target.value}),onKeyDown:event=>{if(event.key==='Enter'){event.preventDefault();this.addCategory(this.state.newCategory);}}}),h('button',{type:'button',onClick:()=>this.addCategory(this.state.newCategory)},'추가')),
              h('p',{className:'bm-help'},'글의 카테고리 이름과 정확히 같아야 합니다. 아직 글이 없는 카테고리는 0개로 표시됩니다.')):null):null);
      },
      renderPreview() {
        const config=this.config();
        return h('details',{className:'bm-preview'},h('summary',null,'배치 미리보기'),h('div',{className:'bm-preview-cover'},h('strong',null,config.title),h('span',null,config.tagline)),h('div',{className:'bm-preview-tabs'},config.tabs.filter(tab=>tab.show_top).map(tab=>h('span',{key:tab.id},tab.title))),h('div',{className:'bm-preview-columns'},h('div',null,h('h4',null,'글 목록'),h('p',null,'선택한 메뉴의 글이 이곳에 표시됩니다.')),h('aside',null,h('strong',null,config.nickname),h('p',null,'카테고리'),config.tabs.filter(tab=>tab.show_side).map(tab=>h('div',{key:tab.id},tab.title)))));
      },
      render() {
        const config=this.config(),error=model.validate(config),sections=[['basic','기본 설정','블로그 정보'],['design','꾸미기 설정','배너 · 프로필 이미지'],['menus','메뉴 관리','카테고리 · 메뉴']];
        return h('section',{className:'blog-manager','aria-label':'블로그 관리'},
          h('header',{className:'bm-header'},h('strong',null,'Kasil',h('span',null,'blog · 관리')),h('a',{href:this.props.field.get('home_url'),target:'_blank',rel:'noopener noreferrer'},'내 블로그 ↗')),
          h('nav',{className:'bm-top-nav','aria-label':'관리 설정'},sections.map(([id,label])=>h('button',{key:id,type:'button','aria-current':this.state.section===id?'page':undefined,onClick:()=>this.setState({section:id})},label)),h('a',{href:'#/collections/posts'},'글 관리')),
          h('div',{className:'bm-workspace'},h('aside',{className:'bm-side'},h('h3',null,'블로그 관리'),sections.map(([id,,label])=>h('button',{key:id,type:'button','aria-current':this.state.section===id?'page':undefined,onClick:()=>this.setState({section:id})},label)),h('hr'),h('p',null,'공개 화면의 카테고리는 오른쪽에 배치됩니다.')),
            h('div',{className:'bm-content'},
              this.state.section==='basic'?h('div',null,h('h2',null,'블로그 정보'),h('p',{className:'bm-help'},'홈 화면에 표시할 제목과 프로필을 설정합니다.'),this.field('홈 화면 제목','title'),this.field('제목 아래 소개','tagline'),this.field('별명','nickname'),this.field('프로필 소개글','bio',true)):null,
              this.state.section==='design'?h('div',null,h('h2',null,'꾸미기 설정'),h('p',{className:'bm-help'},'배너는 가로로 긴 이미지가 어울립니다. 프로필 이미지는 원형으로 표시됩니다.'),this.imageField('상단 배너 이미지','banner_image'),this.imageField('프로필 이미지','profile_image'),h('fieldset',{className:'bm-colors'},h('legend',null,'강조 색상'),[['violet','보라'],['blue','파랑'],['green','초록']].map(([value,label])=>h('label',{key:value,'data-color':value},h('input',{type:'radio',name:'blog-accent',checked:config.accent===value,onChange:()=>this.change({accent:value})}),label)))):null,
              this.state.section==='menus'?this.renderMenus():null,
              error?h('p',{className:'bm-error',role:'alert'},error):null,
              h('p',{className:'bm-notice',role:'status'},this.state.notice),
              this.renderPreview(),h('footer',{className:'bm-save-note'},'변경 후 화면 상단의 게시 버튼으로 저장하세요. 배포가 완료되면 블로그에 반영됩니다.'))));
      }
    });
    CMS.registerWidget({name:'blog-manager',controlComponent:Control,allowMapValue:true});
  }
  root.KasilBlogManager={register};
})(window);
