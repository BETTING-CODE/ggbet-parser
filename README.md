# ggbet-parser
npm package for parsing bookmaker ggbet

## how to install

```shell script
npm install --save ggbet-parser
```

## how to use

### Simple Example code

```javascript
const ggBetParser = require('ggbet-parser')

ggBetParser.getLine('starcraft2')

ggBetParser.getLine('starcraft2', {
  mirrorUrl: 'https://gg23.bet', 
  pageUrl: 2, 
  dateFrom: Date.now(),
  dateTo: Date.now() + 24 * 60 * 60 * 1000, 
})
```

### Parse until the data exist

```javascript
const ggBetParser = require('ggbet-parser')

const allMatches = {}
const options = { dateFrom: Date.now(), dateTo: Date.now() + 7 * 24 * 60 * 60 * 1000 } // for one week

for await (const matches of ggBetParser.getLine('starcraft2', options) {
  Object.assign(allMatches, matches)
}
```

### example of result
```json
{
 "5:aa4db546-63c4-4250-aae8-11369ac1081c": {
    "id": "5:aa4db546-63c4-4250-aae8-11369ac1081c",
    "originalId": "aa4db546-63c4-4250-aae8-11369ac1081c",
    "score": "0:0",
    "status": "NOT_STARTED",
    "startTime": 1584468000000,
    "home": "Chicken Fighters",
    "away": "OG Seed",
    "homeOdd": "3.14",
    "awayOdd": "1.34",
    "tournamentName": "GGBET Championship 2",
    "tournamentId": "gt:3059",
    "handicapOdds": [
      {
        "id": "1",
        "name": "Chicken Fighters (+1.5)",
        "value": "1.67",
        "isActive": true,
        "status": "NOT_RESULTED",
        "competitorId": "gin:7c9ffe12-2578-4c90-9a13-1067863591fa"
      },
      {
        "id": "2",
        "name": "OG Seed (-1.5)",
        "value": "2.12",
        "isActive": true,
        "status": "NOT_RESULTED",
        "competitorId": "gt:43544"
      }
    ]
  },
  "5:3eb057ca-7f82-4053-a3e9-2dc26c9af7ed": {
    "id": "5:3eb057ca-7f82-4053-a3e9-2dc26c9af7ed",
    "originalId": "3eb057ca-7f82-4053-a3e9-2dc26c9af7ed",
    "score": "0:0",
    "status": "NOT_STARTED",
    "startTime": 1584471600000,
    "home": "Warriors of the World",
    "away": "Sneed",
    "homeOdd": "1.48",
    "awayOdd": "2.57",
    "tournamentName": "ESL Premiership 2020 Spring",
    "tournamentId": "gt:2998"
  }
}
```

