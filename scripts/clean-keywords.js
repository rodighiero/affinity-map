#!/usr/bin/env node
/**
 * One-shot keyword cleanup for assets/data.json.
 * Fixes the current dataset without re-fetching lab pages.
 *
 * Actions:
 *  1. Remove stopwords (EN + FR)
 *  2. Remove proper names, place names, noise tokens
 *  3. Merge obvious plural → singular forms (only when singular exists in dataset)
 *  4. Remove words shorter than 4 chars
 *  5. Remove URLs, numeric tokens, encoding artifacts
 */

const fs   = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '../assets/data.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

// ─── Stopwords ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  // Generic English verbs / auxiliaries
  'above','according','achieve','achievement','across','after','also','already',
  'although','amount','another','apply','aspect','aspects','become','becomes',
  'basic','been','before','beyond','both','bring','bringing','call','called',
  'carried','cause','central','close','closed','codes','cold','combination',
  'completed','complex','comprehensive','concluded','conducted','conducts',
  'considered','consisting','contribute','contributed','cover','daily','deal',
  'dedicated','depend','detailed','directly','direction','discrete','doesn',
  'done','driven','each','especially','established','even','expected',
  'extends','extending','external','find','first','following','form',
  'found','founded','four','further','furthermore','future',
  'hand','head','help','helps','highly','huge',
  'identify','improve','improved','improving','inform','integrated','inter',
  'interested','internal','invited','involved','isolated',
  'issue','issued','issues',
  'kind','last','latest','latter','layer','lead','learn','leverage',
  'limit','limiting','link','linked','lives','living','load','long','longer',
  'mainly','making','mass','matter','meaning','much','must','mutually',
  'necessary','necessity','needs','none','normal',
  'obvious','often','once','ongoing','open','opens','overall',
  'particular','particularly','past','people','personal','plan','point',
  'position','possibility','post','potential',
  'principle','principles','problems','promote','promoting','protect',
  'quality','questions',
  'rare','real','received','recent','record','regional','relevant','remote',
  'report','resulting','rigid',
  'safe','several','shaped','shaping','short','since','site','situations',
  'smart','sort','source','space','special','specifically','spread','state',
  'statement','stored','strong','student','students','summary','support','survey',
  'technical','theoretical','theory','three','time','together',
  'toward','towards','town','track','traditional','transfer','turn','typical',
  'ultimate','ultimately','understand','understanding','utilize','utilized',
  'variability','view','virtual','vision',
  'what','where','while','world','year','years','young',
  // Academic filler
  'events','activities','activity','process','processes','practice','practices',
  'strategy','strategies','approach','approaches','method','methods',
  'system','systems','project','projects','order','range','level','type',
  'types','field','area','areas','role','scale','goal','goals',
  'mission','contribution','development','generation','application','applications',
  'technology','technologies','science','sciences',
  // Web / HTML noise
  'http','https','quot','nbsp','rsquo','ldquo','rdquo','ndash','mdash',
  // French stopwords
  'abordent','aujourd','aller','avec','avoir',
  'certaine','champs','chercher','chercheurs','cible','contenu','convoque',
  'cours','doit','donner','durable','elle','ensembles','entretien',
  'fait','fuites','gestion','groupe',
  'implique','incluent','inscrire',
  'jeunes','jour','langue','lundi','mardi','meilleure','mener','mise',
  'missions','moyens','multidisciplinaire',
  'naturel','naturels','objectif','objectifs','oeuvre','offerts','outils',
  'papier','parc','participation','patronage','peinture','pendant','pense',
  'permettant','pondre','politique','politiques','principaux','processus',
  'produit','professeur','programme','projet','projets','propositions',
  'publique','publiques','recherches','repr','repre','ressources','risques',
  'sauvegarde','savoir','scientifique','scientifiques','sentation','serre',
  'suivants','suisse','surtout','talement','territoire','thodes','tire',
  'trajectoires','transposer','transposition','travers','tudie',
  'veloppement','vendredi','vers','visent','voir','sont','deux',
  'cahiers','canton','ceci',
  // Italian
  'della','dello','nella','nelle','degli','delle','nella',
])

// ─── Proper names ─────────────────────────────────────────────────────────────

const NAMES = new Set([
  'alexandre','alexis','alicja','ambroise','ariane',
  'bahar','bernard','bierlaire','bini','bonomo','braghieri','brice','brisson','buttler',
  'christian','dante','diego','dimitrios','dominique','doris',
  'eddy','eugen','fanciotti','filippo',
  'giulia','grabow','haghighat','hendrik','heredia','huang','huwald',
  'janody','karavasilis','kaufmann',
  'lecampion','leocoanet','lestuzzi','leure','lignos',
  'luca','ludwig','luigi','lyesse',
  'manuel','marino','mathey','michel','michela','molinari','morales','moretti',
  'negar','nicola','paola','paulo','pattaroni','pietropolli','pougala',
  'rezvany','rocha','rosa','samuel','sara','shotaro','smith','sylvain',
  'theodore','vincent','violay','vorlet','willie',
])

// ─── Place names and institution tokens ───────────────────────────────────────

const PLACES = new Set([
  'avanchet','bains','chelles','dalmine','dorigny',
  'gangbuk','geneva','gunten','kyoto','lamu','lamuni','lemanic',
  'manhattan','mekong','milano','muong','princeton',
  'sardinia','sarine','sewoon','ticino','vienne','wavre','winterthur','yverdon',
  'austria','suisse','switzerland','lausanne','epfl',
])

// ─── Noise tokens ─────────────────────────────────────────────────────────────

const NOISE = new Set([
  'acht','agel','aisc','ccra','desc',
  'densit','dspace','edrs','enac',
  'fieldrestriction','gvis','ibois','infoscience',
  'laba','lntegrated','ltqe','makercity','mobilit','motto',
  'newsletter','ographie','petrosvibri','polarin','researchoutputs',
  'rogue','shokunin','triptych','unitorlab','xploration',
  'kethsana','festifs','figuratifs','figuration',
  'archizoom','docomomo','holobiont',
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

const shouldDrop = k =>
  STOPWORDS.has(k) ||
  NAMES.has(k)     ||
  PLACES.has(k)    ||
  NOISE.has(k)     ||
  k.length < 4     ||
  /^\d/.test(k)    ||
  k.includes('.')

// ─── Collect all surviving keywords to build plural→singular map ──────────────

const allKws = new Set()
data.graph.nodes.forEach(n =>
  (n.attr.keywords || []).filter(k => !shouldDrop(k)).forEach(k => allKws.add(k))
)

const pluralToSingular = {}
allKws.forEach(k => {
  // -ies → -y  (cities → city, communities → community)
  if (k.endsWith('ies')) {
    const stem = k.slice(0, -3) + 'y'
    if (allKws.has(stem)) pluralToSingular[k] = stem
  }
  // -es → stem  (processes → process, structures... careful)
  else if (k.endsWith('es')) {
    const stem = k.slice(0, -2)
    if (allKws.has(stem)) pluralToSingular[k] = stem
  }
  // -s → stem  (buildings → building, models → model)
  else if (k.endsWith('s')) {
    const stem = k.slice(0, -1)
    if (allKws.has(stem)) pluralToSingular[k] = stem
  }
})

// ─── Clean each node ─────────────────────────────────────────────────────────

let totalBefore = 0
let totalAfter  = 0
let nMerged     = 0

data.graph.nodes.forEach(n => {
  if (!n.attr.keywords) return
  totalBefore += n.attr.keywords.length

  const cleaned = [...new Set(
    n.attr.keywords
      .filter(k => !shouldDrop(k))
      .map(k => {
        const s = pluralToSingular[k]
        if (s) { nMerged++; return s }
        return k
      })
      .filter(k => !shouldDrop(k))  // re-check after normalisation
  )]

  totalAfter += cleaned.length
  n.attr.keywords = cleaned
})

// ─── Report ───────────────────────────────────────────────────────────────────

const finalKws = new Set()
data.graph.nodes.forEach(n => (n.attr.keywords || []).forEach(k => finalKws.add(k)))

console.log(`Keyword instances:  ${totalBefore} → ${totalAfter}  (−${totalBefore - totalAfter})`)
console.log(`Plural merges:      ${nMerged}`)
console.log(`Unique keywords:    ${allKws.size} → ${finalKws.size}`)

// ─── Write ────────────────────────────────────────────────────────────────────

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
console.log('\ndata.json updated ✓')
