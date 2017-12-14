const https = require('https');
const fs = require('fs');
const imageType = require('image-type');
const jimp = require('jimp');
const Spritesmith = require('spritesmith');

let membersQuery = 'https://api.meetup.com/2/members?offset=0&format=json&group_id=17778422&only=photo%2Cname%2Clink&photo-host=secure&page=200&order=name&sig_id=153356042&sig=4d8e3265b4374b84aabb8efcc26eb8107a3ec81b';

async function fetchResults(url) {
  return new Promise((resolve) => {
    https.get(url, function(res) {
      let body = '';
      res.on('data', function(d) {
        body += d;
      });

      res.on('end', function() {
        return resolve({
          members: JSON.parse(body).results,
          total: JSON.parse(body).meta.total_count,
          next: JSON.parse(body).meta.next
        });
      });
    });
  });
}

async function downloadImage(url, filename) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(filename);
    https.get(url, function(response) {
      let ext = 'jpg';

      // Meetup.com sends all images with .jpeg extension but the file type could be anything. Lets fix that!
      response.on('data', function(chunk) {
        if (imageType(chunk) && imageType(chunk).ext) {
          ext = imageType(chunk).ext;
        }
      });

      response.on('end', function() {
        const newfilename = filename.replace('jpeg', ext);
        fs.rename(filename, newfilename, function() {
          // Resize all images to 30x30.

          jimp.read(newfilename).then(image => {
            image.resize(25, 25)
              .write(newfilename);
          }).then(() => resolve(newfilename));
        });
      });

      response.pipe(file);
    });
  });
}

function shuffle(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}
async function go() {
  if (!fs.existsSync('./tmp')) {
    fs.mkdirSync('./tmp');
  }
  if (!fs.existsSync('./tmp/members')) {
    fs.mkdirSync('./tmp/members');
  }

  let result;
  const sprites = [];

  do {
    result = await fetchResults(membersQuery);
    for (let member of result.members) {
      if (member.photo) {
        const memberPhoto = member.photo.thumb_link;
        const filename = 'tmp/members' + memberPhoto.substring(memberPhoto.lastIndexOf('/'));
        sprites.push(await downloadImage(memberPhoto, filename));
      }
    }
    membersQuery = result.next;
  } while (membersQuery);

  Spritesmith.run({ src: shuffle(sprites) }, (err, result) => {
    fs.writeFileSync('./src/images/members.jpg', result.image);
    console.log('Done');
  });
}

go();
