#!/usr/bin/env python3
import json
import os
import tempfile
import re
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ALLOWED = {'knowledge/catalog.json'}

class Handler(SimpleHTTPRequestHandler):
    def _json(self, status, payload):
        data=json.dumps(payload,indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers(); self.wfile.write(data)

    def do_POST(self):
        if self.path not in {'/__aria/repository-sync','/__aria/episode-repository-sync'}:
            return self._json(404, {'ok':False,'error':'Unknown endpoint'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            payload=json.loads(self.rfile.read(length) or b'{}')
            files=payload.get('files') or {}
            if self.path == '/__aria/repository-sync':
                object_id=str(payload.get('topicId','')).strip().lower()
                expected={f'knowledge/topics/{object_id}.json',f'knowledge/topics/{object_id}.manifest.json','knowledge/catalog.json'}
                if not object_id.startswith('topic.') or set(files)!=expected:
                    raise ValueError('Repository sync payload contains unexpected paths.')
                response_key='topicId'
            else:
                object_id=str(payload.get('episodeId','')).strip()
                action=str(payload.get('action','install')).strip().lower()
                safe_id=re.sub(r'[^a-z0-9._-]+','_',object_id.lower()).strip('_') or 'episode'
                response_key='episodeId'
                if not object_id or action not in {'install','update','remove'}:
                    raise ValueError('Episode repository synchronization action is invalid.')
                if action == 'remove':
                    expected={'episodes/catalog.json'}
                    if set(files)!=expected:
                        raise ValueError('Episode repository removal payload must contain only the catalog.')
                    delete_paths=payload.get('deletePaths') or []
                    allowed_delete={f'episodes/episodes/{safe_id}.json',f'episodes/manifests/{safe_id}.manifest.json'}
                    if set(delete_paths)!=allowed_delete:
                        raise ValueError('Episode repository removal contains unexpected delete paths.')
                else:
                    expected={f'episodes/episodes/{safe_id}.json',f'episodes/manifests/{safe_id}.manifest.json','episodes/catalog.json'}
                    if set(files)!=expected:
                        raise ValueError('Episode repository sync payload contains unexpected paths.')
            written=[]
            for rel,text in files.items():
                if rel not in expected or '..' in Path(rel).parts:
                    raise ValueError(f'Unsafe path: {rel}')
                json.loads(text)
                target=(ROOT/rel).resolve()
                if ROOT not in target.parents:
                    raise ValueError(f'Path escapes project root: {rel}')
                target.parent.mkdir(parents=True,exist_ok=True)
                fd,tmp=tempfile.mkstemp(prefix=target.name+'.',suffix='.tmp',dir=target.parent)
                try:
                    with os.fdopen(fd,'w',encoding='utf-8',newline='\n') as f: f.write(text)
                    os.replace(tmp,target)
                finally:
                    if os.path.exists(tmp): os.unlink(tmp)
                written.append(rel)
            deleted=[]
            if self.path == '/__aria/episode-repository-sync' and action == 'remove':
                for rel in delete_paths:
                    target=(ROOT/rel).resolve()
                    if ROOT not in target.parents:
                        raise ValueError(f'Path escapes project root: {rel}')
                    if target.exists():
                        target.unlink(); deleted.append(rel)
            return self._json(200,{'ok':True,response_key:object_id,'action':locals().get('action','sync'),'written':written,'deleted':deleted})
        except Exception as exc:
            return self._json(400,{'ok':False,'error':str(exc)})

if __name__=='__main__':
    os.chdir(ROOT)
    print('Aria local server: http://localhost:8877')
    print('Activation repository writer: enabled')
    ThreadingHTTPServer(('127.0.0.1',8877),Handler).serve_forever()
