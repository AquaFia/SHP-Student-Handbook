/* =========================================================
   SHARED COMPANION CONTEXT AWARENESS v2.2
   Phase 2: Notion-backed event repository.
   - Browser-local clock/date remains authoritative for "now".
   - All supplied birthday/event month-day data is annual by definition.
   - Emits "companioncontextchange" when meaningful context changes.
   - Emits "companioncontextrepositorychange" when repository status changes.
   - Does not directly modify chat, portraits, themes, music, identity, or episodes.
   ========================================================= */
(()=>{
  'use strict';

  const EVENT_NAME='companioncontextchange';
  const REPOSITORY_EVENT_NAME='companioncontextrepositorychange';

  function pad2(value){
    return String(value).padStart(2,'0');
  }

  function localDateKey(date=new Date()){
    return `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;
  }

  function monthDayKey(date=new Date()){
    return `${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;
  }

  function timeOfDay(hour){
    if(hour>=5 && hour<12)return 'morning';
    if(hour>=12 && hour<17)return 'afternoon';
    if(hour>=17 && hour<22)return 'evening';
    return 'night';
  }

  function seasonFor(month){
    if(month===12 || month<=2)return 'winter';
    if(month<=5)return 'spring';
    if(month<=8)return 'summer';
    return 'autumn';
  }

  function slug(value){
    return String(value??'')
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }

  function normalizeDateValue(value){
    if(!value)return null;
    const text=String(value).trim();
    const match=text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!match)return null;
    return {
      source:text,
      year:Number(match[1]),
      month:Number(match[2]),
      day:Number(match[3]),
      dateKey:`${match[1]}-${match[2]}-${match[3]}`,
      monthDay:`${match[2]}-${match[3]}`
    };
  }

  function normalizeBirthday(item,index){
    if(!item || typeof item!=='object')return null;
    const suppliedMonthDay=String(item.monthDay||'').match(/^(\d{2})-(\d{2})$/);
    const date=suppliedMonthDay
      ? {dateKey:null,monthDay:`${suppliedMonthDay[1]}-${suppliedMonthDay[2]}`}
      : normalizeDateValue(item.date||item.birthday);
    if(!date)return null;
    const character=String(item.character||item.name||'').trim();
    if(!character)return null;
    return {
      id:String(item.id||`birthday-${slug(character)||index}`),
      type:'birthday',
      character,
      date:date.dateKey,
      monthDay:date.monthDay,
      visualContext:String(item.visualContext||'birthday').trim()||'birthday',
      metadata:item.metadata&&typeof item.metadata==='object'?item.metadata:{}
    };
  }

  function normalizeEvent(item,index){
    if(!item || typeof item!=='object')return null;
    const suppliedStart=String(item.startMonthDay||'').match(/^(\d{2})-(\d{2})$/);
    const suppliedEnd=String(item.endMonthDay||'').match(/^(\d{2})-(\d{2})$/);
    const start=suppliedStart
      ? {monthDay:`${suppliedStart[1]}-${suppliedStart[2]}`}
      : normalizeDateValue(item.date||item.startDate||item.start);
    if(!start)return null;
    const end=suppliedEnd
      ? {monthDay:`${suppliedEnd[1]}-${suppliedEnd[2]}`}
      : (normalizeDateValue(item.endDate||item.end)||start);
    const name=String(item.name||item.title||'').trim();
    if(!name)return null;
    return {
      id:String(item.id||slug(name)||`event-${index}`),
      type:String(item.type||'event').trim().toLowerCase(),
      name,
      startMonthDay:start.monthDay,
      endMonthDay:end.monthDay,
      visualContext:String(item.visualContext||slug(name)).trim(),
      metadata:item.metadata&&typeof item.metadata==='object'?item.metadata:{}
    };
  }

  function annualRangeContains(currentMonthDay,startMonthDay,endMonthDay){
    if(startMonthDay<=endMonthDay){
      return currentMonthDay>=startMonthDay && currentMonthDay<=endMonthDay;
    }
    return currentMonthDay>=startMonthDay || currentMonthDay<=endMonthDay;
  }

  function eventIsActive(event,date){
    return annualRangeContains(
      monthDayKey(date),
      event.startMonthDay,
      event.endMonthDay
    );
  }

  function birthdayIsToday(birthday,date){
    return birthday.monthDay===monthDayKey(date);
  }

  function stableComparable(state){
    return JSON.stringify({
      date:state.date,
      weekday:state.weekday,
      timeOfDay:state.timeOfDay,
      month:state.month,
      season:state.season,
      birthdaysToday:state.birthdaysToday,
      eventsToday:state.eventsToday,
      visualContexts:state.visualContexts
    });
  }

  const CompanionContext={
    config:{
      companionId:null,
      endpoint:null
    },

    data:{
      birthdays:[],
      events:[]
    },

    repository:{
      status:'idle',
      source:null,
      fetchedAt:null,
      error:null
    },

    state:null,
    timer:null,
    loadPromise:null,

    async initialize(config={}){
      if(config && typeof config==='object'){
        this.config={...this.config,...config};
      }

      this.refresh({force:true});

      if(!this.timer){
        this.timer=window.setInterval(()=>this.refresh(),60000);
      }

      if(this.config.endpoint){
        await this.loadRemoteEvents();
      }

      return this.get();
    },

    setRepositoryStatus(status,details={}){
      this.repository={
        status,
        source:details.source??this.repository.source??null,
        fetchedAt:details.fetchedAt??this.repository.fetchedAt??null,
        error:details.error??null
      };

      window.dispatchEvent(new CustomEvent(REPOSITORY_EVENT_NAME,{
        detail:this.getRepositoryStatus()
      }));
    },

    getRepositoryStatus(){
      return {...this.repository};
    },

    async loadRemoteEvents({force=false}={}){
      if(!this.config.endpoint)return null;
      if(this.loadPromise && !force)return this.loadPromise;

      this.setRepositoryStatus('loading');

      this.loadPromise=(async()=>{
        try{
          const response=await fetch(this.config.endpoint,{
            method:'GET',
            headers:{'Accept':'application/json'},
            cache:force?'reload':'default'
          });

          if(!response.ok){
            throw new Error(`Context repository request failed: ${response.status}`);
          }

          const payload=await response.json();

          if(
            !payload ||
            payload.schema!=='companion-context-repository-v1' ||
            !Array.isArray(payload.birthdays) ||
            !Array.isArray(payload.events)
          ){
            throw new Error('Unsupported context repository response.');
          }

          this.setEvents(payload);

          this.setRepositoryStatus('ready',{
            source:payload.source||'notion',
            fetchedAt:payload.generatedAt||new Date().toISOString()
          });

          return payload;
        }catch(error){
          this.setRepositoryStatus('unavailable',{
            error:String(error?.message||error)
          });
          console.error('Could not load companion context repository.',error);
          return null;
        }finally{
          this.loadPromise=null;
        }
      })();

      return this.loadPromise;
    },

    setEvents(payload={}){
      const birthdays=Array.isArray(payload.birthdays)?payload.birthdays:[];
      const events=Array.isArray(payload.events)?payload.events:[];

      this.data.birthdays=birthdays
        .map(normalizeBirthday)
        .filter(Boolean);

      this.data.events=events
        .map(normalizeEvent)
        .filter(Boolean);

      return this.refresh({force:true});
    },

    clearEvents(){
      this.data.birthdays=[];
      this.data.events=[];
      return this.refresh({force:true});
    },

    buildState(now=new Date()){
      const birthdaysToday=this.data.birthdays
        .filter(item=>birthdayIsToday(item,now))
        .map(item=>({...item}));

      const eventsToday=this.data.events
        .filter(item=>eventIsActive(item,now))
        .map(item=>({...item}));

      const visualContexts=[];
      birthdaysToday.forEach(item=>{
        if(item.visualContext && !visualContexts.includes(item.visualContext)){
          visualContexts.push(item.visualContext);
        }
      });
      eventsToday.forEach(item=>{
        if(item.visualContext && !visualContexts.includes(item.visualContext)){
          visualContexts.push(item.visualContext);
        }
      });

      return Object.freeze({
        companionId:this.config.companionId||null,
        timestamp:now.toISOString(),
        timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||null,
        date:localDateKey(now),
        weekday:new Intl.DateTimeFormat(undefined,{weekday:'long'}).format(now),
        month:new Intl.DateTimeFormat(undefined,{month:'long'}).format(now),
        year:now.getFullYear(),
        hour:now.getHours(),
        timeOfDay:timeOfDay(now.getHours()),
        season:seasonFor(now.getMonth()+1),
        birthdaysToday:Object.freeze(birthdaysToday),
        eventsToday:Object.freeze(eventsToday),
        visualContexts:Object.freeze(visualContexts)
      });
    },

    refresh({force=false}={}){
      const next=this.buildState(new Date());
      const changed=
        force ||
        !this.state ||
        stableComparable(this.state)!==stableComparable(next);

      this.state=next;

      if(changed){
        window.dispatchEvent(new CustomEvent(EVENT_NAME,{
          detail:this.get()
        }));
      }

      return this.get();
    },

    get(){
      return this.state?{
        ...this.state,
        birthdaysToday:[...this.state.birthdaysToday],
        eventsToday:[...this.state.eventsToday],
        visualContexts:[...this.state.visualContexts],
        repository:this.getRepositoryStatus()
      }:null;
    },

    subscribe(listener){
      if(typeof listener!=='function')return ()=>{};
      const handler=event=>listener(event.detail);
      window.addEventListener(EVENT_NAME,handler);
      return ()=>window.removeEventListener(EVENT_NAME,handler);
    },

    subscribeRepository(listener){
      if(typeof listener!=='function')return ()=>{};
      const handler=event=>listener(event.detail);
      window.addEventListener(REPOSITORY_EVENT_NAME,handler);
      return ()=>window.removeEventListener(REPOSITORY_EVENT_NAME,handler);
    },

    destroy(){
      if(this.timer){
        clearInterval(this.timer);
        this.timer=null;
      }
    }
  };

  Object.defineProperty(window,'CompanionContext',{
    value:CompanionContext,
    configurable:false,
    enumerable:true,
    writable:false
  });
})();
