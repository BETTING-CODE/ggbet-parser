const ggbetURL = 'https://ggbetily.com'
const ggbetParser = require('./index.js')

ggbetParser.getLine('starcraft2', {
  mirrorUrl: ggbetURL
})
  .then(data => {
    console.log('###########')
    console.log(data)
  })
  .catch(e => console.log(e))
