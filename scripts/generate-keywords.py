#!/usr/bin/env python3
"""
Fetches EPFL lab pages and extracts research keywords for each lab.
Stores keywords per node in data.json.
"""

import json
import urllib.request
import urllib.error
import re
import time
from collections import Counter

STOP_WORDS = {
    # Articles, prepositions, conjunctions
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'between', 'within', 'across', 'over', 'under', 'around', 'among',
    # Verbs and auxiliaries
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'work', 'working', 'works', 'use', 'uses', 'used', 'using',
    'make', 'makes', 'made', 'develop', 'developed', 'developing',
    'include', 'includes', 'including', 'provide', 'provides', 'provided',
    'focus', 'focused', 'focuses', 'aim', 'aims', 'aimed',
    'study', 'studies', 'based', 'allow', 'allows', 'allowed',
    # Pronouns
    'it', 'its', 'we', 'our', 'you', 'your', 'they', 'their', 'them',
    'he', 'she', 'this', 'that', 'these', 'those', 'which', 'who',
    # Generic adverbs / adjectives
    'how', 'all', 'each', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'than', 'too', 'very', 'can', 'just', 'also', 'as', 'if', 'so',
    'then', 'there', 'here', 'only', 'many', 'well', 'new', 'high', 'large',
    'small', 'main', 'major', 'wide', 'specific', 'general', 'different',
    'various', 'important', 'current', 'currently', 'related', 'existing',
    'fundamental', 'significant', 'innovative', 'novel', 'advanced',
    'above', 'according', 'achieve', 'achieved', 'across', 'after', 'already',
    'although', 'amount', 'another', 'aspect', 'become', 'becomes', 'basic',
    'before', 'beyond', 'bring', 'bringing', 'call', 'called', 'carried',
    'cause', 'central', 'close', 'closed', 'cold', 'combination', 'completed',
    'complex', 'comprehensive', 'concluded', 'conducted', 'considered',
    'consisting', 'contribute', 'contributed', 'cover', 'daily', 'deal',
    'dedicated', 'depend', 'detailed', 'directly', 'discrete',
    'done', 'driven', 'especially', 'established', 'even', 'expected',
    'external', 'find', 'first', 'following', 'form', 'found', 'founded',
    'further', 'furthermore', 'future',
    'hand', 'head', 'help', 'helps', 'highly', 'huge',
    'identify', 'improve', 'improved', 'improving', 'inform', 'interested',
    'internal', 'invited', 'involved', 'isolated', 'issue', 'issued',
    'kind', 'last', 'latest', 'latter', 'layer', 'lead', 'learn', 'leverage',
    'limit', 'limiting', 'link', 'linked', 'lives', 'living', 'load',
    'long', 'longer', 'mainly', 'making', 'mass', 'matter', 'meaning',
    'much', 'must', 'mutually', 'necessary', 'necessity', 'needs', 'none',
    'normal', 'obvious', 'often', 'once', 'ongoing', 'open', 'overall',
    'particular', 'particularly', 'past', 'people', 'personal', 'plan',
    'point', 'position', 'possibility', 'post', 'potential',
    'principle', 'principles', 'problems', 'promote', 'promoting', 'protect',
    'quality', 'questions', 'rare', 'real', 'received', 'recent', 'record',
    'regional', 'relevant', 'remote', 'report', 'resulting', 'rigid',
    'safe', 'several', 'shaped', 'shaping', 'short', 'since', 'site',
    'situations', 'smart', 'sort', 'source', 'space', 'spaces', 'special',
    'specifically', 'spread', 'state', 'statement', 'stored', 'strong',
    'student', 'students', 'summary', 'support', 'survey',
    'technical', 'theoretical', 'theory', 'three', 'time', 'together',
    'toward', 'towards', 'town', 'track', 'traditional', 'transfer',
    'turn', 'typical', 'ultimate', 'ultimately', 'understand', 'understanding',
    'utilize', 'utilized', 'variability', 'view', 'virtual', 'vision',
    'what', 'where', 'while', 'world', 'year', 'years', 'young',
    # Academic filler
    'practice', 'practices', 'strategy', 'strategies', 'approach', 'approaches',
    'method', 'methods', 'system', 'systems', 'project', 'projects',
    'order', 'range', 'level', 'type', 'types', 'field', 'area', 'areas',
    'role', 'scale', 'goal', 'goals', 'mission', 'contribution', 'development',
    'generation', 'application', 'applications', 'technology', 'technologies',
    'science', 'sciences', 'process', 'processes', 'activity', 'activities',
    # Lab / institution tokens
    'lab', 'laboratory', 'epfl', 'research', 'group', 'chair', 'professor',
    'prof', 'center', 'centre', 'unit', 'section', 'team', 'institute',
    'department', 'school', 'faculty', 'swiss', 'federal', 'lausanne', 'enac',
    'number', 'event', 'events',
    # Web / HTML noise
    'quot', 'nbsp', 'rsquo', 'ldquo', 'rdquo', 'ndash', 'mdash', 'amp',
    'laquo', 'raquo', 'copy', 'trade', 'euro', 'false', 'true', 'null',
    'http', 'https',
    # Navigation noise
    'published', 'news', 'read', 'more', 'discover', 'follow', 'subscribe',
    'contact', 'home', 'back', 'next', 'prev', 'page', 'click', 'here',
    'menu', 'search', 'login', 'share', 'print', 'download', 'twitter',
    'linkedin', 'facebook', 'instagram', 'youtube', 'cookie', 'privacy',
    'award', 'prize', 'congratulations', 'welcome', 'thesis',
    'dissertation', 'paper', 'journal', 'conference', 'best', 'winner',
    # French noise (from bilingual pages)
    'pour', 'dans', 'avec', 'depuis', 'lors', 'comme', 'mais', 'aussi',
    'plus', 'moins', 'bien', 'tous', 'tout', 'cette', 'vous',
    'nous', 'leur', 'leurs', 'une', 'des', 'les', 'aux', 'par', 'sur',
    'sous', 'entre', 'dont', 'donc', 'ainsi', 'laboratoire', 'recherche',
    'sein', 'afin', 'notamment', 'permet', 'partir', 'sont', 'deux',
    'pour', 'dans', 'avec', 'depuis', 'lors', 'comme', 'mais',
    'etre', 'faire', 'avoir', 'savoir', 'pouvoir', 'vouloir',
    'chercher', 'chercheurs', 'objectif', 'objectifs', 'ressources',
    'oeuvre', 'outils', 'projet', 'projets', 'travaux',
    # Lab name fragments (self-references)
    'alice', 'lipid', 'disal', 'echo', 'lsms', 'lemr', 'wire', 'ceat',
    'lapis', 'cclab', 'ecos', 'aphys', 'ecol', 'topo', 'tsam', 'herus',
    'lasur', 'lasig', 'luts', 'cnpa', 'lure', 'cryos', 'eesd', 'resslab',
}

def fetch_html(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })
    with urllib.request.urlopen(req, timeout=10) as response:
        return response.read().decode('utf-8', errors='ignore')

def extract_text_from_html(html):
    html = re.sub(r'<script[^>]*>.*?</script>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<nav[^>]*>.*?</nav>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<header[^>]*>.*?</header>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<footer[^>]*>.*?</footer>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    # HTML entities
    html = re.sub(r'&[a-zA-Z]+;', ' ', html)
    html = re.sub(r'&#\d+;', ' ', html)
    # Try to get main content only
    main_match = re.search(r'<main[^>]*>(.*?)</main>', html, flags=re.DOTALL | re.IGNORECASE)
    if main_match:
        html = main_match.group(1)
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

PLURAL_RULES = [
    (r'ies$',  'y'),    # communities → community
    (r'ves$',  'f'),    # leaves → leaf
    (r'ses$',  's'),    # processes → process
    (r'xes$',  'x'),    # boxes → box
    (r'zes$',  'z'),    # quizzes → quiz
    (r'ches$', 'ch'),   # patches → patch
    (r'shes$', 'sh'),   # flashes → flash
    (r'([^aeiou])s$', r'\1'),  # buildings → building (consonant + s)
]

def lemmatize(word):
    """Very simple rule-based singular form for English nouns."""
    import re as _re
    for pattern, replacement in PLURAL_RULES:
        if _re.search(pattern, word):
            candidate = _re.sub(pattern, replacement, word)
            if len(candidate) >= 4:
                return candidate
    return word

def extract_keywords_from_text(text, top_n=40):
    words = re.findall(r'\b[a-zA-Z]{5,}\b', text.lower())  # min 5 chars
    filtered = [lemmatize(w) for w in words if w not in STOP_WORDS and not w.isdigit()]
    filtered = [w for w in filtered if w not in STOP_WORDS]  # re-check after lemmatize
    counter = Counter(filtered)
    # Only keep words that appear at least twice on the page
    return [kw for kw, count in counter.most_common(top_n) if count >= 2]

def extract_keywords_from_name(en_name):
    words = re.findall(r'\b[a-zA-Z]{4,}\b', en_name.lower())
    return [w for w in words if w not in STOP_WORDS]

def fetch_lab_keywords(acronym, en_name):
    slug = acronym.lower().replace('_', '-').replace(' ', '-')

    url_overrides = {
        'gr-acm':   'https://acm.epfl.ch/',
        'gr-gn':    'https://www.epfl.ch/labs/gr-gn/',
        'gr-cel':   'https://www.epfl.ch/labs/gr-cel/',
        'gr-lud':   'https://www.psi.ch/en/cpm',
        'lch':      'https://www.epfl.ch/labs/lch/',
        'pl-lch':   'https://www.epfl.ch/labs/lch/',
        'leso-pb':  'https://www.epfl.ch/labs/leso-pb/',
        'ldm2':     'https://www.epfl.ch/labs/ldm/',
        'ibeton':   'https://www.epfl.ch/labs/ibeton/',
        'ecol':     'https://www.epfl.ch/labs/ecol/',
        'ecos':     'https://www.epfl.ch/labs/ecos/',
        'aprl':     'https://www.epfl.ch/labs/aprl/',
        'sub':      'https://www.epfl.ch/labs/sub/',
        # Old labs — try archive
        'lth2':     'https://archiveweb.epfl.ch/lth2.epfl.ch/',
        'lth3':     'https://archiveweb.epfl.ch/lth3.epfl.ch/',
        'form':     'https://archiveweb.epfl.ch/form.epfl.ch/',
        'east-co':  'https://archiveweb.epfl.ch/east.epfl.ch/',
        'lamu':     'https://archiveweb.epfl.ch/lamu.epfl.ch/',
        'laba':     'https://archiveweb.epfl.ch/laba.epfl.ch/',
        'lac':      'https://archiveweb.epfl.ch/lac.epfl.ch/',
        'imac':     'https://archiveweb.epfl.ch/imac.epfl.ch/',
        'sber':     'https://archiveweb.epfl.ch/sber.epfl.ch/',
        'ibeton':   'https://archiveweb.epfl.ch/ibeton.epfl.ch/',
        'liv':      'https://archiveweb.epfl.ch/liv.epfl.ch/',
        'archizoom':'https://archiveweb.epfl.ch/archizoom.epfl.ch/',
        'leso-pb':  'https://archiveweb.epfl.ch/leso-pb.epfl.ch/',
        'cnpa':     'https://archiveweb.epfl.ch/cnpa.epfl.ch/',
        'gr-gn':    'https://archiveweb.epfl.ch/gr-gn.epfl.ch/',
        'aprl':     'https://archiveweb.epfl.ch/aprl.epfl.ch/',
        'sub':      'https://archiveweb.epfl.ch/sub.epfl.ch/',
    }

    urls_to_try = []
    if slug in url_overrides:
        urls_to_try.append(url_overrides[slug])
    urls_to_try += [
        f'https://www.epfl.ch/labs/{slug}/',
        f'https://www.epfl.ch/labs/{slug}/research/',
        f'https://archiveweb.epfl.ch/{slug}.epfl.ch/',
    ]

    name_keywords = extract_keywords_from_name(en_name)
    all_text = ''

    for url in urls_to_try[:2]:  # Try up to 2 URLs per lab
        try:
            html = fetch_html(url)
            all_text += ' ' + extract_text_from_html(html)
            time.sleep(0.2)
        except Exception:
            pass

    if all_text.strip():
        web_keywords = extract_keywords_from_text(all_text, top_n=40)
        combined = list(dict.fromkeys(name_keywords + web_keywords))
        combined = [kw for kw in combined if kw not in STOP_WORDS]
        print(f'  ✓ {acronym:12} ({len(combined):2} kw): {combined[:6]}')
        return combined[:35]
    else:
        print(f'  ✗ {acronym:12} ({len(name_keywords):2} kw): {name_keywords}')
        return name_keywords


def main():
    with open('assets/data.json', 'r') as f:
        data = json.load(f)

    nodes = data['graph']['nodes']
    links = data['graph']['links']

    print(f'Fetching keywords for {len(nodes)} labs...\n')

    lab_keywords = {}
    for node in nodes:
        acronym = node['attr']['name']
        en_name = node['attr'].get('enName', acronym)
        keywords = fetch_lab_keywords(acronym, en_name)
        node['attr']['keywords'] = keywords
        lab_keywords[acronym] = set(keywords)
        time.sleep(0.2)

    print(f'\nComputing keyword affinity scores for {len(links)} links...')

    for link in links:
        src = link['source'] if isinstance(link['source'], str) else link['source']['attr']['name']
        tgt = link['target'] if isinstance(link['target'], str) else link['target']['attr']['name']
        shared = lab_keywords.get(src, set()) & lab_keywords.get(tgt, set())
        link['metrics']['values']['key'] = len(shared)

    # Ensure order/default fields on existing affinities (key stays out of this list)
    for i, aff in enumerate(data['affinities']):
        if 'order' not in aff:
            aff['order'] = i
        if 'default' not in aff:
            aff['default'] = True

    with open('assets/data.json', 'w') as f:
        json.dump(data, f, indent=2)

    print('\nDone!')
    avg = sum(len(n['attr'].get('keywords', [])) for n in nodes) / len(nodes)
    print(f'Average keywords per lab: {avg:.1f}')
    links_with_key = sum(1 for l in links if l['metrics']['values']['key'] > 0)
    print(f'Links with keyword affinity: {links_with_key}/{len(links)}')


if __name__ == '__main__':
    main()
