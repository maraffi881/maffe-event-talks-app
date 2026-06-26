import os
import re
import urllib.request
import ssl
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# XML/HTML stripping helper
class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = []

    def handle_data(self, d):
        self.text.append(d)

    def get_data(self):
        return "".join(self.text)

def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()

def parse_feed():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    
    # Namespaces
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        date = title.text if title is not None else "Unknown Date"
        
        link_elem = entry.find('atom:link', ns)
        link = link_elem.get('href') if link_elem is not None else ""
        
        content_elem = entry.find('atom:content', ns)
        if content_elem is None or content_elem.text is None:
            continue
            
        content_html = content_elem.text
        
        # Split by h3 headings (e.g. <h3>Feature</h3>, <h3>Change</h3>, etc.)
        matches = list(re.finditer(r'<h3>([^<]+)</h3>', content_html))
        
        if not matches:
            # Fallback if no h3 tags exist
            text_content = strip_tags(content_html).strip()
            text_content = re.sub(r'\s+', ' ', text_content)
            entries.append({
                'date': date,
                'type': 'General',
                'content_html': content_html,
                'content_text': text_content,
                'link': link
            })
        else:
            for i, match in enumerate(matches):
                update_type = match.group(1).strip()
                start_idx = match.end()
                end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content_html)
                
                item_html = content_html[start_idx:end_idx].strip()
                
                # Strip tags and normalize whitespaces for text preview/tweets
                item_text = strip_tags(item_html)
                item_text = re.sub(r'\s+', ' ', item_text).strip()
                
                # Make external links target="_blank" and style them
                item_html_styled = re.sub(
                    r'<a href="([^"]+)"', 
                    r'<a href="\1" target="_blank" rel="noopener noreferrer" class="release-link"', 
                    item_html
                )
                
                entries.append({
                    'date': date,
                    'type': update_type,
                    'content_html': item_html_styled,
                    'content_text': item_text,
                    'link': link
                })
                
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        releases = parse_feed()
        return jsonify({
            'status': 'success',
            'data': releases
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Default port for development
    app.run(host='0.0.0.0', port=5050, debug=True)
