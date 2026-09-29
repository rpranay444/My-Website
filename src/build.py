"""Builds the single-file site: src/ -> site/index.html (the folder Netlify publishes).

Run from anywhere:  python3 src/build.py
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'site', 'index.html')


def read(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        return f.read()


src = read('source_patched.html')

# 1. work section, keeping the two event photos from the page
a = src.index('<section class="section container" id="work">')
b = src.index('</section>', a) + len('</section>')
old = src[a:b]
pair = old[old.index('<div class="photo-pair professional-pair">'):old.rindex('</section>')]
src = src[:a] + read('work_section.html').replace('<!--PAIR-->', pair) + src[b:]

# 2. the page script reads the shared project data
m = re.search(r'const projects=\[.*?\];\n', src, re.S)
assert m
src = src[:m.start()] + 'const projects=window.PR_PROJECTS;\n' + src[m.end():]

# 3. project data and renderer, ahead of the page script
i = src.index("<script>'use strict';")
src = src[:i] + '<script>' + read('work_data.js') + '</script><script>' + read('work_pre.js') + '</script>' + src[i:]

# 4. styles
src = src.replace('</head>', '<style>' + read('work.css') + '</style></head>', 1)

# 5. motion layer: libraries, 3D shuttle, intro curtain and scroll motion
libs = ''.join('<script>' + read('libs/' + p) + '</script>\n' for p in [
    'gsap-3.12.5/dist/gsap.min.js',
    'gsap-3.12.5/dist/ScrollTrigger.min.js',
    'lenis-1.1.13/dist/lenis.min.js',
    'three-0.128.0/build/three.min.js',
]) + '<script>' + read('shuttle3d.js') + '</script>\n'

pre = '''<script>(function(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;try{if(sessionStorage.getItem('pr-intro'))return;sessionStorage.setItem('pr-intro','1')}catch(e){}var d=document.createElement('div');d.className='m-loader';d.setAttribute('aria-hidden','true');d.innerHTML='<div class="m-wm"><span>p</span><span>r</span><span class="dot">.</span></div><div class="m-meta"><span>Pranay Reddy</span><span>Marketing &amp; Strategy · Singapore</span></div><div class="m-bar"></div>';document.body.appendChild(d);setTimeout(function(){if(d.parentNode)d.remove()},7000)})()</script>'''

out = src.replace('</head>', '<style>' + read('enhance.css') + read('fx.css') + '</style></head>', 1).replace('<body>', '<body>' + pre, 1)
j = out.rindex('</body>')
out = out[:j] + libs + '<script>' + read('enhance.js') + '</script><script>' + read('work_post.js') + '</script><script>' + read('fx.js') + '</script>' + out[j:]

# 6. the résumé PDF, embedded so the download works on any host (site/Pranay-Reddy-Resume.pdf is the source)
import base64
with open(os.path.join(HERE, '..', 'site', 'Pranay-Reddy-Resume.pdf'), 'rb') as f:
    pdf64 = base64.b64encode(f.read()).decode('ascii')
j = out.rindex('</body>')
out = out[:j] + '<script>' + read('resume.js').replace('__RESUME_PDF_BASE64__', pdf64) + '</script>' + out[j:]

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(out)
print('site/index.html', len(out) // 1024, 'KB')
