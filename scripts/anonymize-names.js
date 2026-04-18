#!/usr/bin/env node
/**
 * Replace all placeholder names ("André Gorz") with unique random fake names.
 * Updates both network.nodes[].attr.name and labProfNames on each lab node.
 */

const fs   = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '../assets/data.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

// ─── Name pools ───────────────────────────────────────────────────────────────

const FIRST = [
  'Alice','Bruno','Carmen','David','Elena','Felix','Giulia','Hugo',
  'Irene','Jonas','Katia','Luca','Maya','Nils','Olivia','Pedro',
  'Quinn','Rosa','Stefan','Tara','Ulrich','Vera','Walter','Xenia',
  'Yves','Zofia','Adrian','Beatrix','Carlos','Diana','Emre','Fatima',
  'Gabriel','Hana','Ivan','Julia','Kai','Lena','Marco','Nora',
  'Oscar','Petra','Rami','Sara','Tobias','Uma','Victor','Wanda',
  'Xander','Yasmin','Zeno','Adele','Boris','Chiara','Diego','Esme',
  'Florian','Greta','Henrik','Ines','Jerome','Klara','Lars','Mia',
  'Nico','Orla','Pascal','Rahel','Sven','Talia','Ugo','Viola',
  'Willem','Xiomara','Yara','Zara','Ariel','Blanca','Cedric','Daria',
]

const LAST = [
  'Andersen','Becker','Costa','Durand','Evans','Fischer','Garcia',
  'Hansen','Ionescu','Jensen','Klein','Laurent','Martin','Nakamura',
  'Oliveira','Papadopoulos','Reyes','Schmidt','Torres','Urquhart',
  'Vogel','Weber','Xavier','Yamamoto','Ziegler','Almeida','Bernard',
  'Colombo','Delacroix','Eriksson','Ferraro','Girard','Hoffmann',
  'Ibrahim','Johansson','Kowalski','Leclerc','Moreau','Nielsen',
  'Okonkwo','Petrov','Renard','Sorensen','Takahashi','Ulrich',
  'Vargas','Wolff','Xu','Zakaria','Amara','Brunner','Castillo',
  'Dietrich','Esteves','Fontaine','Gruber','Herrera','Ivanova',
  'Janssen','Keller','Lindqvist','Mansouri','Novak','Ortega',
  'Patel','Ramos','Svensson','Tanaka','Unterkircher','Vasquez',
  'Wenger','Yilmaz','Zimmermann','Abreu','Berger','Cruz',
]

// ─── Name generator (no repeats globally) ────────────────────────────────────

const used = new Set()

function randomName() {
  let name, attempts = 0
  do {
    const first = FIRST[Math.floor(Math.random() * FIRST.length)]
    const last  = LAST [Math.floor(Math.random() * LAST.length)]
    name = `${first} ${last}`
    attempts++
    if (attempts > 10000) throw new Error('Name pool exhausted')
  } while (used.has(name))
  used.add(name)
  return name
}

// ─── Apply ────────────────────────────────────────────────────────────────────

let memberCount = 0
let profCount   = 0

data.graph.nodes.forEach(node => {
  // Rename all lab members
  ;(node.network?.nodes || []).forEach(member => {
    member.attr.name = randomName()
    memberCount++
  })

  // Set professor name to the first member (conventionally the PI),
  // or generate a fresh one if there are no members
  const firstMember = node.network?.nodes?.[0]
  const profName = firstMember ? firstMember.attr.name : randomName()
  node.attr.labProfNames = `Prof. ${profName}`
  profCount++
})

// ─── Report ───────────────────────────────────────────────────────────────────

console.log(`Members renamed: ${memberCount}`)
console.log(`Lab professors:  ${profCount}`)
console.log(`Unique names:    ${used.size}`)

// ─── Write ────────────────────────────────────────────────────────────────────

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
console.log('\ndata.json updated ✓')
