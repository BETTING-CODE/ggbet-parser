
const puppeteer = require('puppeteer')

function getMatches(page) {
    return new Promise(async resolve => {
        const result = {}

        const handleWebSocketFrameReceived = params => {
            try {
                const data = JSON.parse(params.response.payloadData)

                if (data && data.payload && data.payload.data && data.payload.data.matches) {

                    const { matches } = data.payload.data

                    for (const match of matches.filter(Boolean)) {
                        try {
                            const winnerMarket = match.markets.find(market => /^winner$/i.test(market.name))
                            const mapHandicapMarket = match.markets.find(market => /^map handicap$/i.test(market.name))

                            if (winnerMarket) {
                                const { id, fixture } = match
                                const { competitors, score, status, startTime, tournament } = fixture

                                if (result[id] !== undefined) {
                                    resolve(result)
                                    break
                                }

                                const { name: tournamentName, id: tournamentId } = tournament
                                const { name: home } = competitors.find(cmp => /home/i.test(cmp.homeAway))
                                const { name: away } = competitors.find(cmp => /away/i.test(cmp.homeAway))
                                const { value: homeOdd } = winnerMarket.odds.find(odd => odd.name === home)
                                const { value: awayOdd } = winnerMarket.odds.find(odd => odd.name === away)

                                result[id] = {
                                    id,
                                    originalId: id.length > 36 ? id.slice(-36) : id,
                                    score,
                                    status,
                                    startTime: +new Date(startTime),
                                    home,
                                    away,
                                    homeOdd,
                                    awayOdd,
                                    tournamentName,
                                    tournamentId
                                }

                                if (mapHandicapMarket) {
                                    result[id].handicapOdds = mapHandicapMarket.odds
                                }
                            }
                        } catch (e) { }
                    }

                    resolve(result)
                }
            } catch (e) { 
                resolve({ error : e })
            }
        }

        const f12 = await page.target().createCDPSession()
        await f12.send('Network.enable')
        await f12.send('Page.enable')

        f12.on('Network.webSocketFrameReceived', handleWebSocketFrameReceived)
    })
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

function generateDateFromUrl(dateFrom, dateTo) {
    if (dateFrom == null && dateTo == null) {
        return ''
    } else {
        //date format - YYYY-MM-DD
        let dateFromUrlString = ''
        if (dateFrom != null) {
            dateFrom = new Date(dateFrom)
            const M = (dateFrom.getMonth() + 1).toString().padStart(2,'0')
            const D = dateFrom.getDate().toString().padStart(2,'0')
            const Y = dateFrom.getFullYear()
            dateFromUrlString += `&dateFrom=${Y}-${M}-${D}`
        }

        if (dateTo != null) {
            dateTo = new Date(dateTo)
            const M = (dateTo.getMonth() + 1).toString().padStart(2,'0')
            const D = dateTo.getDate().toString().padStart(2,'0')
            const Y = dateTo.getFullYear()
            dateFromUrlString += `&dateTo=${Y}-${M}-${D}`
        }
        return dateFromUrlString
    }
}

async function getLine(discipline = 'starcraft2', urlGGbet = 'https://gg23.bet/en', urlPage = 1, dateFrom = null, dateTo = null) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const url = `${urlGGbet}/${discipline}?page=${urlPage}${generateDateFromUrl(dateFrom,dateTo)}`

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const matches = await getMatches(page)

    await page.close()
    await browser.close()

    return matches
}

module.exports = {
    getLine
}