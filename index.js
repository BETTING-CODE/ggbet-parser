const puppeteer = require('puppeteer')

async function getMatches (browserPage, timeout) {
  const result = {}

  let debounceTimeoutId = null

  const handleWebSocketFrameReceived = async (params, resolve) => {
    const debounceResolve = () => {
      clearTimeout(debounceTimeoutId)
      debounceTimeoutId = setTimeout(() => resolve(result), 1000)
    }

    try {
      const data = JSON.parse(params.response.payloadData)

      if (data && data.payload && data.payload.data && data.payload.data.matches) {
        const { matches } = data.payload.data

        for (const match of matches.filter(Boolean)) {
          try {
            const winnerMarket = match.markets.find(market => /^winner$/i.test(market.name))
            const mapHandicapMarket = match.markets.find(market => /^map handicap$/i.test(market.name))

            if (winnerMarket || mapHandicapMarket) {
              const { id, fixture } = match
              const { competitors, score, status, startTime, tournament } = fixture
              const { markets } = match

              if (result[id] !== undefined) {
                const sameMarketsAsWas = !winnerMarket ^ !result[id].homeOdd && !mapHandicapMarket ^ !result[id].handicapOdds
                const alreadyFulfilled = result[id].homeOdd && result[id].handicapOdds

                if (sameMarketsAsWas || alreadyFulfilled) {
                  debounceResolve()
                  break
                }
              }

              const { name: tournamentName, id: tournamentId } = tournament
              const { name: home } = competitors.find(cmp => /home/i.test(cmp.homeAway))
              const { name: away } = competitors.find(cmp => /away/i.test(cmp.homeAway))

              let bo = ''

              // console.log(markets.map(m => Array.isArray(m.specifiers) ? m.specifiers : []).flat())

              for (const market of markets) {
                if (Array.isArray(market.specifiers)) {
                  const { value: bestOf } = market.specifiers.find(spec => spec.name === 'bo') || {}

                  bo = bestOf || ''
                }
              }

              result[id] = {
                id,
                originalId: id.length > 36 ? id.slice(-36) : id,
                score,
                status,
                startTime: +new Date(startTime),
                home,
                away,
                tournamentName,
                tournamentId,
                bo
              }

              if (winnerMarket) {
                const { value: homeOdd } = winnerMarket.odds.find(odd => odd.name === home)
                const { value: awayOdd } = winnerMarket.odds.find(odd => odd.name === away)

                result[id].homeOdd = homeOdd
                result[id].awayOdd = awayOdd
              }

              if (mapHandicapMarket) {
                result[id].handicapOdds = mapHandicapMarket.odds
              }
            }
          } catch (e) {
            console.log(e)
          }
        }

        debounceResolve()
      }
    } catch (error) {
      // console.log(e)
    }
  }
  const f12 = await browserPage.target().createCDPSession()
  await f12.send('Network.enable')
  await f12.send('Page.enable')

  let timeoutId

  await Promise.race([
    new Promise(resolve => {
      f12.on('Network.webSocketFrameReceived', params => handleWebSocketFrameReceived(params, resolve))
    }),
    new Promise(resolve => {
      timeoutId = setTimeout(resolve, timeout)
    })
  ])

  clearTimeout(timeoutId)

  return result
}

/*

list of naming discipline in ggbet
- counter-strike
- dota2
- starcraft2
- league-of-legends
- battlegrounds
- call-of-duty
- hearthstone
- overwatch
- and etc

*/

async function createBrowserAndPage () {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36')
  await page.setViewport({ width: 1920, height: 1080 })

  return { browser, page }
}

function generateUrl (baseUrl, discipline, { urlPage, dateFrom, dateTo } = {}) {
  return `${baseUrl}/en/${discipline}?page=${urlPage}${generateDateFromUrl(dateFrom, dateTo)}`
}

function generateDateFromUrl (dateFrom, dateTo) {
  if (dateFrom === null && dateTo === null) {
    return ''
  } else {
    // date format - YYYY-MM-DD
    let dateFromUrlString = ''
    if (dateFrom != null) {
      dateFrom = new Date(dateFrom)
      const M = (dateFrom.getMonth() + 1).toString().padStart(2, '0')
      const D = dateFrom.getDate().toString().padStart(2, '0')
      const Y = dateFrom.getFullYear()
      dateFromUrlString += `&dateFrom=${Y}-${M}-${D}`
    }

    if (dateTo != null) {
      dateTo = new Date(dateTo)
      const M = (dateTo.getMonth() + 1).toString().padStart(2, '0')
      const D = dateTo.getDate().toString().padStart(2, '0')
      const Y = dateTo.getFullYear()
      dateFromUrlString += `&dateTo=${Y}-${M}-${D}`
    }
    return dateFromUrlString
  }
}

/**
 *
 * @param {string} discipline
 * @param {object} [options]
 * @param {string} [options.mirrorUrl='https://ggbet.com/en']
 * @param {number} [options.urlPage=1]
 * @param {number|Date} [options.dateFrom]
 * @param {number|Date} [options.dateTo]
 * @returns {Promise<object>}
 */
async function getLine (discipline, {
  mirrorUrl = 'https://ggbet.com',
  urlPage = 1,
  dateFrom = null,
  dateTo = null,
  timeout = 5000
} = {}) {
  if (!discipline) {
    throw new Error('No discipline provided')
  }

  const { browser, page } = await createBrowserAndPage()

  const url = generateUrl(mirrorUrl, discipline, { urlPage, dateFrom, dateTo })

  await page.goto(url, { waitUntil: 'domcontentloaded' })

  const matches = await getMatches(page, timeout)

  await page.close()
  await browser.close()

  return matches
}

/**
 * @param {string} discipline
 * @param {object} [options]
 * @param {string} [options.mirrorUrl='https://ggbet.com/en']
 * @param {number} [options.fromPage=1]
 * @param {number|Date} [options.dateFrom]
 * @param {number|Date} [options.dateTo]
 * @returns {AsyncGenerator<object>}
 */
async function * getLineUntilDataExist (discipline, {
  mirrorUrl = 'https://ggbet.com',
  fromPage = 1,
  dateFrom = null,
  dateTo = null,
  chunkTimeout = 5000
} = {}) {
  if (!discipline) {
    throw new Error('No discipline provided')
  }

  const { browser, page } = await createBrowserAndPage()

  fromPage = fromPage - 1

  while (++fromPage) {
    try {
      const url = generateUrl(mirrorUrl, discipline, { urlPage: fromPage, dateFrom, dateTo })

      await page.goto(url, { waitUntil: 'domcontentloaded' })

      const matches = await getMatches(page, chunkTimeout)

      if (!matches || Object.keys(matches).length === 0 || matches.error) {
        break
      } else {
        yield matches
      }
    } catch (e) {
      break
    }
  }

  await page.close()
  await browser.close()
}

module.exports = {
  getLine,
  getLineUntilDataExist
}
