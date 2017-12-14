const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdown');
const sass = require('metalsmith-sass');
const collections = require('metalsmith-collections');
const inPlace = require('metalsmith-in-place');
const permalinks = require('metalsmith-permalinks');
const pagination = require('metalsmith-pagination');
const Handlebars = require('handlebars');
const moment = require('moment');
const {fetchMeetupDetails} = require('./meetup');
const md = require('marked');

// Prevent markdown renderer wrapping all content in paragraphs
const renderer = new md.Renderer;
renderer.paragraph = function(text) {
  return text;
}

Handlebars.registerHelper('moment', function(date, format) {
  return new moment(date).format(format);
});
Handlebars.registerHelper('withFirst', function(context, options) {
  return options.fn(context[0]);
});
Handlebars.registerHelper('coalesce', function() {
  const len = arguments.length;
  for (let i = 0; i < len - 1; i ++) {
    if (arguments[i]) {
      return arguments[i];
    }
  }
  return;
});
Handlebars.registerHelper('getLink', function(context, options) {
  const d = moment(context.date).format('YYYY-MM-DD');
  const title = (context.title || '').replace(/\W+/g, '-');
  return `/${d}-${title}/`.toLowerCase();
});
Handlebars.registerHelper('md', function(context) {
  return md(context, { renderer: renderer });
});
Handlebars.registerHelper('lowerCase', function(context) {
  return context ? context.toLowerCase() : '';
});


async function build() {
  const meetupDetails = await fetchMeetupDetails();
  Metalsmith(__dirname)
    .metadata({
      site : {
        title: 'JSOxford',
        url: 'http://jsoxford-next.marcusnoble.co.uk', //'https://jsoxford.com',
        description: 'A monthly meetup of JavaScript enthusiasts in Oxford, UK.'
      },
      meetup: meetupDetails
    })
    .source('./src')
    .destination('./build')
    .clean(true)
    .use(collections({
      events: {
        pattern: 'events/*',
        sortBy: 'date',
        reverse: true,
      },
      pages: {
        pattern: 'pages/*'
      }
    }))
    .use(pagination({
      'collections.events': {
        perPage: 5,
        layout: 'archive.html',
        first: 'archive/index.html',
        path: 'archive/:num/index.html',
        pageMetadata: {
          title: 'Archive'
        }
      }
    }))
    .use(inPlace({
      engine: 'handlebars',
      partials: 'layouts/partials'
    }))
    .use(markdown())
    .use(permalinks({
      pattern: ':date-:title',
      date: 'YYYY-MM-DD',
      linksets: [
        {
          match: { collection: 'pages' },
          pattern: ':title'
        }
      ]
    }))
    .use(layouts({
      engine: 'handlebars',
      partials: 'layouts/partials'
    }))
    .use(sass())
    .build(function(err) {
      if (err) throw err;
    });
}

build();
