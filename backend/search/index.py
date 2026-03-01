"""
Поиск в интернете через DuckDuckGo — возвращает список ссылок по запросу пользователя.
"""
import json
import urllib.request
import urllib.parse
import re


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    params = event.get('queryStringParameters') or {}
    query = params.get('q', '').strip()
    search_type = params.get('type', 'web')  # web, images, videos, news

    if not query:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Query is required'})
        }

    results = []

    if search_type == 'images':
        results = search_images(query)
    elif search_type == 'videos':
        results = search_videos(query)
    elif search_type == 'news':
        results = search_news(query)
    else:
        results = search_web(query)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'results': results, 'query': query, 'type': search_type})
    }


def fetch_url(url, headers=None):
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    req.add_header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
    req.add_header('Accept-Language', 'ru-RU,ru;q=0.9,en;q=0.8')
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode('utf-8', errors='ignore')


def search_web(query):
    encoded = urllib.parse.quote(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded}&kl=ru-ru"
    html = fetch_url(url)

    results = []

    # Parse result blocks
    blocks = re.findall(r'<div class="result[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>', html, re.DOTALL)

    for block in blocks[:20]:
        title_match = re.search(r'<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.DOTALL)
        snippet_match = re.search(r'class="result__snippet"[^>]*>(.*?)</(?:a|span)>', block, re.DOTALL)
        url_match = re.search(r'class="result__url"[^>]*>(.*?)</(?:a|span)>', block, re.DOTALL)

        if title_match:
            href = title_match.group(1)
            title = re.sub(r'<[^>]+>', '', title_match.group(2)).strip()
            snippet = re.sub(r'<[^>]+>', '', snippet_match.group(1)).strip() if snippet_match else ''
            display_url = re.sub(r'<[^>]+>', '', url_match.group(1)).strip() if url_match else ''

            # Decode DDG redirect URL
            if href.startswith('//duckduckgo.com/l/?'):
                uddg_match = re.search(r'uddg=([^&]+)', href)
                if uddg_match:
                    href = urllib.parse.unquote(uddg_match.group(1))
            elif href.startswith('/l/?'):
                uddg_match = re.search(r'uddg=([^&]+)', href)
                if uddg_match:
                    href = urllib.parse.unquote(uddg_match.group(1))

            if title and href.startswith('http'):
                results.append({
                    'title': title,
                    'url': href,
                    'snippet': snippet,
                    'display_url': display_url,
                    'type': 'web'
                })

    # Fallback: try another pattern
    if not results:
        links = re.findall(r'<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL)
        for href, title in links[:20]:
            title_clean = re.sub(r'<[^>]+>', '', title).strip()
            if href.startswith('/l/?'):
                uddg_match = re.search(r'uddg=([^&]+)', href)
                if uddg_match:
                    href = urllib.parse.unquote(uddg_match.group(1))
            if title_clean and href.startswith('http'):
                results.append({
                    'title': title_clean,
                    'url': href,
                    'snippet': '',
                    'display_url': '',
                    'type': 'web'
                })

    return results


def search_images(query):
    encoded = urllib.parse.quote(query)
    # Use DuckDuckGo images API (vqd token approach)
    # First get vqd token
    html = fetch_url(f"https://duckduckgo.com/?q={encoded}&iax=images&ia=images")
    vqd_match = re.search(r'vqd=(["\'])([^"\']+)\1', html)
    if not vqd_match:
        vqd_match = re.search(r'vqd=([\d-]+)', html)
        vqd = vqd_match.group(1) if vqd_match else '3'
    else:
        vqd = vqd_match.group(2)

    api_url = f"https://duckduckgo.com/i.js?l=ru-ru&o=json&q={encoded}&vqd={urllib.parse.quote(vqd)}&f=,,,,,&p=1"
    try:
        data = fetch_url(api_url, {'Accept': 'application/json'})
        obj = json.loads(data)
        results = []
        for item in obj.get('results', [])[:24]:
            results.append({
                'title': item.get('title', ''),
                'url': item.get('url', ''),
                'thumbnail': item.get('thumbnail', ''),
                'image': item.get('image', ''),
                'width': item.get('width', 0),
                'height': item.get('height', 0),
                'source': item.get('source', ''),
                'type': 'image'
            })
        return results
    except Exception:
        return []


def search_videos(query):
    encoded = urllib.parse.quote(query)
    # YouTube search via scraping
    yt_url = f"https://www.youtube.com/results?search_query={encoded}"
    try:
        html = fetch_url(yt_url)
        # Extract initial data JSON
        data_match = re.search(r'var ytInitialData = ({.*?});</script>', html, re.DOTALL)
        if not data_match:
            return search_web(f"{query} video")
        
        data = json.loads(data_match.group(1))
        results = []
        
        # Navigate to video results
        contents = (data
            .get('contents', {})
            .get('twoColumnSearchResultsRenderer', {})
            .get('primaryContents', {})
            .get('sectionListRenderer', {})
            .get('contents', []))
        
        for section in contents:
            items = (section
                .get('itemSectionRenderer', {})
                .get('contents', []))
            for item in items:
                video = item.get('videoRenderer', {})
                if not video:
                    continue
                video_id = video.get('videoId', '')
                title_runs = video.get('title', {}).get('runs', [])
                title = ''.join(r.get('text', '') for r in title_runs)
                channel_runs = video.get('ownerText', {}).get('runs', [])
                channel = ''.join(r.get('text', '') for r in channel_runs)
                duration = video.get('lengthText', {}).get('simpleText', '')
                views = video.get('viewCountText', {}).get('simpleText', '')
                thumb = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                
                if video_id and title:
                    results.append({
                        'title': title,
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'thumbnail': thumb,
                        'channel': channel,
                        'duration': duration,
                        'views': views,
                        'type': 'video'
                    })
                if len(results) >= 16:
                    break
            if len(results) >= 16:
                break
        
        return results if results else search_web(f"{query} site:youtube.com")
    except Exception:
        return search_web(f"{query} video youtube")


def search_news(query):
    encoded = urllib.parse.quote(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded}&df=w&iar=news&ia=news"
    html = fetch_url(url)
    results = search_web(query)
    # Mark as news
    for r in results:
        r['type'] = 'news'
    return results
