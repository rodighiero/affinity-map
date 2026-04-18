#!/usr/bin/env node
/**
 * Translate non-English keywords to English in assets/data.json.
 * null → remove (either too generic or English equivalent already present)
 */

const fs   = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '../assets/data.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

// ─── Translation map ──────────────────────────────────────────────────────────
// null = remove (noise, too generic, or exact duplicate of existing EN keyword)

const TRANSLATE = {
  // French → English
  accompagnement:    'mentoring',
  alimentaire:       'food',
  alimentaires:      'food',
  alimentation:      'nutrition',
  alliant:           null,           // "combining" — too generic
  analogique:        'analog',
  analyse:           'analysis',     // deduped if 'analysis' already present
  architecte:        'architect',
  architecturale:    'architectural',
  atelier:           'workshop',
  biotechnologie:    'biotechnology',
  cellules:          'cells',
  climat:            'climate',
  climatique:        'climatic',
  climatiques:       'climatic',
  conception:        'design',
  connaissance:      'knowledge',
  contemporaine:     'contemporary',
  contacter:         null,           // noise
  critique:          'criticism',
  culturels:         'cultural',
  dessin:            'drawing',
  dirige:            null,           // "directed" — too generic
  doctorale:         'doctoral',
  documentaires:     'documentary',
  domaine:           'domain',
  domaines:          'domain',
  dynamique:         'dynamics',
  economie:          'economy',
  effet:             'effect',
  enseignement:      'teaching',
  environnement:     'environment',
  environnementale:  'environmental',
  environnementales: 'environmental',
  equipe:            'team',
  exercice:          'exercise',
  exposition:        'exhibition',
  formation:         'training',
  historique:        'historical',
  hybride:           'hybrid',
  hydraulique:       'hydraulic',
  industrie:         'industry',
  informatique:      'informatics',
  intervenant:       null,           // "speaker/participant" — too generic
  liens:             'connections',
  lieu:              null,           // "place" — too generic
  libre:             null,           // "free/open" — too generic
  lisation:          null,           // truncated artifact
  locales:           'local',
  lumi:              null,           // truncated artifact
  moderne:           'modern',
  montagne:          'mountain',
  organisation:      'organization',
  photographie:      'photography',
  plateforme:        'platform',
  pointe:            null,           // "cutting-edge" — too adjective-like
  pratique:          'practice',
  pratiques:         'practice',
  prototypage:       'prototyping',
  restauration:      'restoration',
  restructuration:   'restructuring',
  rique:             null,           // truncated artifact
  solide:            'solid',
  souterraine:       'underground',
  stabiliser:        'stabilization',
  topographie:       'topography',
  urbaine:           'urban',
  visualisation:     'visualization',

  // Proper names that slipped through cleaning
  elisabeth:         null,
  emmanuel:          null,
  eric:              null,
  laloui:            null,
  perrault:          null,

  // Institutions / companies
  eawag:             null,
  gaznat:            null,
  politecnico:       null,
  polytechnique:     null,
  archizoom:         null,
  docomomo:          null,

  // Proper nouns / event names
  thetis:            null,
  torii:             null,
  biennale:          'biennial',

  // Nationalities (not research keywords)
  italian:           null,
  japanese:          null,

  // Calendar months
  december:          null,
  january:           null,
  november:          null,
}

// ─── Apply translations ───────────────────────────────────────────────────────

let nTranslated = 0
let nRemoved    = 0

data.graph.nodes.forEach(n => {
  if (!n.attr.keywords) return

  const cleaned = [...new Set(
    n.attr.keywords.map(k => {
      if (!(k in TRANSLATE)) return k          // not in map → keep as-is

      const target = TRANSLATE[k]
      if (target === null) { nRemoved++; return null }
      nTranslated++
      return target
    })
    .filter(Boolean)
  )]

  n.attr.keywords = cleaned
})

// ─── Report ───────────────────────────────────────────────────────────────────

const finalKws = new Set()
data.graph.nodes.forEach(n => (n.attr.keywords || []).forEach(k => finalKws.add(k)))

console.log(`Translated: ${nTranslated} keyword instances`)
console.log(`Removed:    ${nRemoved} keyword instances`)
console.log(`Unique keywords: ${finalKws.size}`)

// ─── Write ────────────────────────────────────────────────────────────────────

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
console.log('\ndata.json updated ✓')
