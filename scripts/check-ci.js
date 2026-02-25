const https = require('https')

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
      let data = ''
      res.on('data', (c) => data += c)
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })
}

async function main() {
  const runId = process.argv[2] || '22415171290'
  const data = await get(`https://api.github.com/repos/omarfourati55/plan_your_idea/actions/runs/${runId}/jobs`)
  for (const j of data.jobs) {
    console.log(`\nJob: ${j.name} | ${j.conclusion}`)
    for (const s of j.steps) {
      if (s.conclusion && s.conclusion !== 'success' && s.conclusion !== 'skipped') {
        console.log(`  FAILED step: ${s.name}`)
      }
    }
  }
}

main().catch(console.error)
