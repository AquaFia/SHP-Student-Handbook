#!/usr/bin/env python3
import json
import os
import tempfile
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
        if self.path != '/__aria/repository-sync':
            return self._json(404, {'ok':False,'error':'Unknown endpoint'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            payload=json.loads(self.rfile.read(length) or b'{}')
            topic_id=str(payload.get('topicId','')).strip().lower()
            files=payload.get('files') or {}
            expected={f'knowledge/topics/{topic_id}.json',f'knowledge/topics/{topic_id}.manifest.json','knowledge/catalog.json'}
            if not topic_id.startswith('topic.') or set(files)!=expected:
                raise ValueError('Repository sync payload contains unexpected paths.')
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
            return self._json(200,{'ok':True,'topicId':topic_id,'written':written})
        except Exception as exc:
            return self._json(400,{'ok':False,'error':str(exc)})

if __name__=='__main__':
    os.chdir(ROOT)
    print('Aria local server: http://localhost:8000')
    print('Activation repository writer: enabled')
    ThreadingHTTPServer(('127.0.0.1',8000),Handler).serve_forever()
