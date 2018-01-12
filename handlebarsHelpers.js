const moment = require('moment');
const md = require('marked');

// Prevent markdown renderer wrapping all content in paragraphs
const renderer = new md.Renderer;
renderer.paragraph = function(text) {
  return text;
}

module.exports = {
  'moment': function(date, format) {
    return new moment(date).format(format);
  },
  'withFirst': function(context, options) {
    return options.fn(context[0]);
  },
  'coalesce': function() {
    const len = arguments.length;
    for (let i = 0; i < len - 1; i ++) {
      if (arguments[i]) {
        return arguments[i];
      }
    }
    return;
  },
  'getLink': function(context, options) {
    const d = moment(context.date).format('YYYY-MM-DD');
    const title = (context.title || '').replace(/\W+/g, '-');
    return `/${d}-${title}/`.toLowerCase();
  },
  'md': function(context) {
    return md(context, { renderer: renderer });
  },
  'lowerCase': function(context) {
    return context ? context.toLowerCase() : '';
  }
}
