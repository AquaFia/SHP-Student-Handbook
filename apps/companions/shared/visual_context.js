/* =========================================================
   SHARED VISUAL CONTEXT MANAGER v1.1
   Phase 4A foundation.
   - Observes CompanionContext only.
   - Loads/unloads optional context theme stylesheets.
   - Exposes portrait context resolution without owning portraits.
   - Does not modify identity, music, messages, episodes, or layout logic.
   ========================================================= */
(()=>{
  'use strict';

  const CONTEXT_EVENT='companioncontextchange';
  const VISUAL_EVENT='companionvisualcontextchange';

  function slug(value){
    return String(value??'')
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }

  function unique(values){
    return [...new Set(values.filter(Boolean))];
  }

  const VisualContextManager={
    config:{
      companionId:null,
      themesBasePath:'themes/',
      themeExtension:'.css'
    },

    activeContexts:[],
    themeLinks:new Map(),
    initialized:false,

    initialize(config={}){
      if(this.initialized)return this.getState();

      if(config && typeof config==='object'){
        this.config={...this.config,...config};
      }

      this.initialized=true;

      window.addEventListener(CONTEXT_EVENT,event=>{
        this.applyContext(event.detail);
      });

      const current=window.CompanionContext?.get?.();
      if(current)this.applyContext(current);
      else this.applyContext({visualContexts:[]});

      return this.getState();
    },

    normalizeContexts(contextState){
      return unique(
        (contextState?.visualContexts||[])
          .map(slug)
      );
    },

    applyContext(contextState){
      const next=this.normalizeContexts(contextState);
      const previous=[...this.activeContexts];

      this.activeContexts=next;
      this.syncThemeStylesheets();
      this.emit(previous);

      return this.getState();
    },

    syncThemeStylesheets(){
      const wanted=new Set(this.activeContexts);

      for(const [context,link] of this.themeLinks.entries()){
        if(wanted.has(context))continue;
        link.remove();
        this.themeLinks.delete(context);
      }

      for(const [index,context] of this.activeContexts.entries()){
        if(this.themeLinks.has(context)){
          this.themeLinks.get(context).dataset.visualPriority=String(index);
          continue;
        }

        const link=document.createElement('link');
        link.rel='stylesheet';
        link.dataset.visualContext=context;
        link.dataset.visualPriority=String(index);
        link.href=
          `${this.config.themesBasePath}${encodeURIComponent(context)}${this.config.themeExtension}`;

        /*
          Missing theme files are valid. Remove failed links quietly so a
          context can still affect portraits/messages without requiring CSS.
        */
        link.addEventListener('error',()=>{
          if(this.themeLinks.get(context)===link){
            this.themeLinks.delete(context);
          }
          link.remove();
        },{once:true});

        document.head.appendChild(link);
        this.themeLinks.set(context,link);
      }

      // Preserve active-context order so later stylesheets can add accents.
      for(const context of this.activeContexts){
        const link=this.themeLinks.get(context);
        if(link)document.head.appendChild(link);
      }

      document.documentElement.dataset.visualContexts=
        this.activeContexts.join(' ');
    },

    getPortraitContextCandidates(){
      /*
        Order is intentional:
        1. Combined active context
        2. Individual active contexts in repository order
        3. "normal" fallback

        PortraitManager remains responsible for deciding whether a candidate
        actually exists in the expression manifest.
      */
      const active=[...this.activeContexts];
      const candidates=[];

      if(active.length>1){
        candidates.push(active.join('+'));
      }

      candidates.push(...active,'normal');
      return unique(candidates);
    },

    resolvePortraitVariant(variants){
      if(!variants || typeof variants!=='object')return null;

      for(const candidate of this.getPortraitContextCandidates()){
        const value=variants[candidate];
        if(value)return {
          context:candidate,
          value
        };
      }

      return null;
    },

    isActive(context){
      return this.activeContexts.includes(slug(context));
    },

    getState(){
      return {
        companionId:this.config.companionId||null,
        activeContexts:[...this.activeContexts],
        portraitCandidates:this.getPortraitContextCandidates()
      };
    },

    subscribe(listener){
      if(typeof listener!=='function')return ()=>{};
      const handler=event=>listener(event.detail);
      window.addEventListener(VISUAL_EVENT,handler);
      return ()=>window.removeEventListener(VISUAL_EVENT,handler);
    },

    emit(previous){
      window.dispatchEvent(new CustomEvent(VISUAL_EVENT,{
        detail:{
          previousContexts:[...previous],
          ...this.getState()
        }
      }));
    }
  };

  Object.defineProperty(window,'VisualContextManager',{
    value:VisualContextManager,
    configurable:false,
    enumerable:true,
    writable:false
  });
})();
