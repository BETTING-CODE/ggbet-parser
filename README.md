# ggbet-parser
npm package for parsing bookmaker ggbet

## how to install

```shell script
npm install --save ggbet-parser
```

## how to use

###Simple Example code

```javascript
const ggBetParser = require('ggbet-parser')

ggBetParser.getLine('starcraft2')

ggBetParser.getLine('starcraft2', {
  mirrorUrl: 'https://gg23.bet/en', 
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

