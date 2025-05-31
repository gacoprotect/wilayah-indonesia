import apicache from 'apicache';

export function setupCache(app) {
  const cache = apicache.middleware;
  
  // Konfigurasi cache
  app.use(cache('5 minutes'));
  
  // Endpoint khusus cache
  app.get('/cache/clear', (req, res) => {
    apicache.clear();
    res.json({ success: true, message: 'Cache dibersihkan' });
  });
  
  console.log('Middleware cache diaktifkan');
}