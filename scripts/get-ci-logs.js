const https = require('https')

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node', ...headers } }, (res) => {
      // follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location, headers).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', (c) => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve(data) }
      })
    }).on('error', reject)
  })
}

async function main() {
  const runId = process.argv[2] || '22415171290'
  const jobName = process.argv[3] || 'E2E'

  const jobsData = await get(`https://api.github.com/repos/omarfourati55/plan_your_idea/actions/runs/${runId}/jobs`)
  const job = jobsData.jobs.find(j => j.name.includes(jobName))
  if (!job) { console.log('Jobs:', jobsData.jobs.map(j=>j.name)); return }

  console.log(`Getting logs for job: ${job.name} (${job.id})`)
  const logUrl = `https://api.github.com/repos/omarfourati55/plan_your_idea/actions/jobs/${job.id}/logs`
  const logs = await get(logUrl)

  if (typeof logs === 'string') {
    // Print last 200 lines
    const lines = logs.split('\n')
    console.log(lines.slice(-200).join('\n'))
  } else {
    console.log(JSON.stringify(logs, null, 2))
  }
}

main().catch(console.error)
