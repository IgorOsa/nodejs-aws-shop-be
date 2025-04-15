const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3000;

function getRecipientUrl(serviceName) {
  // Map service name to env variable, e.g. 'cart' => 'CART_SERVICE_URL'
  const envKey = `${serviceName.toUpperCase()}_SERVICE_URL`;
  return process.env[envKey];
}

const server = http.createServer((req, res) => {
  // Extract service name from URL: /{recipient-service-name}?
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
  const serviceName = urlParts[0];
  if (!serviceName) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Recipient service name not specified.' }));
    return;
  }
  const recipientUrl = getRecipientUrl(serviceName);
  if (!recipientUrl) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Cannot process request' }));
    return;
  }
  // Forward the request to the recipient service using fetch
  const forwardPath = req.url.substring(serviceName.length + 1) || '/';
  const targetUrl = recipientUrl + forwardPath;
  console.log('Forwarding request to', targetUrl);

  // Gather the request body (for POST/PUT/PATCH)
  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', async () => {
    const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;
    // Clone and adjust headers
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    // Use fetch to forward the request
    try {
      const fetch = global.fetch || (await import('node-fetch')).default;
      const fetchOptions = {
        method: req.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? body : undefined,
        redirect: 'manual',
      };
      const response = await fetch(targetUrl, fetchOptions);
      // Forward status and headers
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      // Stream the response body for native fetch (ReadableStream)
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              res.end();
              return;
            }
            res.write(Buffer.from(value));
            push();
          });
        }
        push();
      } else if (response.body) {
        // Fallback for node-fetch (Node.js stream)
        response.body.pipe(res);
      } else {
        res.end();
      }
    } catch (err) {
      console.error('Fetch forwarding error:', err);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Cannot process request', details: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`BFF service listening on port ${PORT}`);
});
