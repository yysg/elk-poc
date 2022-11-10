
const faker = require('faker');
const moment = require('moment');
const fs = require('fs');

const stream = fs.createWriteStream('../../log/web1/access.log', {
  flags: 'a'
});

function writeToStream(n) {
  for (; n < 1000000; n++) {
    const access = faker.fake(`{{internet.ip}} - - [${timestamp()}] "{{internet.httpMethod}} /{{internet.domainWord}}/{{lorem.slug}} HTTP/1.1" 200 {{datatype.number}} "-" "{{internet.userAgent}}"`);
    if (!stream.write(`${access}\n`)) {
      stream.once('drain', () => writeToStream(n + 1))
      return;
    }
  }
  stream.end();
}

writeToStream(0);

function timestamp () {
  const ts = faker.date.recent(7);
  const str = moment(ts).format('YYYY-MM-DD HH:mm:ssZ');
  return str;
}