export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        var body = await request.json();
        var message = body.message || '';
        
        if (!message) {
          return new Response(JSON.stringify({ reply: 'لطفاً سوالت رو بپرس.' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        var response = await fetch('https://api-free.ir/api/chat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message })
        });

        var data = await response.json();
        var reply = data.result || data.response || data.reply || 'پاسخی دریافت نشد';

        return new Response(JSON.stringify({ reply: reply }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch(e) {
        return new Response(JSON.stringify({ reply: 'سلام! من GNG AI هستم. سوالت رو بپرس! 🤖' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    var targetUrl = 'https://abedihamid257-afk.github.io/GNG-AI/';
    if (url.pathname !== '/') targetUrl += url.pathname.slice(1);
    if (url.search) targetUrl += url.search;

    var staticResponse = await fetch(targetUrl);
    return new Response(staticResponse.body, {
      status: staticResponse.status,
      headers: {
        'Content-Type': staticResponse.headers.get('Content-Type') || 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
};
