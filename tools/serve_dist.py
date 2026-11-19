import http.server, os, sys, functools
ROOT=sys.argv[1]; PORT=int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Embedder-Policy','credentialless')
        self.send_header('Cross-Origin-Opener-Policy','same-origin')
        super().end_headers()
    def send_head(self):
        p=self.translate_path(self.path.split('?')[0])
        if not os.path.exists(p): self.path='/index.html'
        return super().send_head()
    def log_message(self,*a): pass
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.wasm':'application/wasm','.js':'application/javascript'}
http.server.ThreadingHTTPServer(('127.0.0.1',PORT),functools.partial(H,directory=ROOT)).serve_forever()
