from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import urllib2

class RequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
    def do_HEAD(self):
        self._set_headers()
        info = 'Head from: {} '.format(self.client_address[0])
        csvfile = urllib2.urlopen("http://" + self.client_address[0] + ":8088")
        with open('data/happiness.csv','wb') as output:
            output.write(csvfile.read())
        print(info)

    def do_GET(self):
        self._set_headers()
        info = "<html><body><h1>Happy receiver</h1>"
        info += "Waiting for http HEAD events. When they come I will download "
        info += "<code>senderip:666/home/pi/happiness.csv</code> to local dir</body></html>"
        self.wfile.write(info)

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8088):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print 'Happy server running localhost:8088...'
    httpd.serve_forever()

run()