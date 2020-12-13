const ggbetURL = 'https://gg94.bet'
const ggbetParser = require('./index.js')

const ggbetLine = ggbetParser.getLine('starcraft2', {
    mirrorUrl : ggbetURL
})
.then(data => {
    console.log('###########')
    console.log(data)
})
.catch(e => console.log(e))