const Handlebars = require("handlebars");
const Metalsmith = require("metalsmith");
const layouts = require("metalsmith-layouts");
const collections = require("metalsmith-collections");
const permalinks = require("metalsmith-permalinks");
const gzip = require("metalsmith-gzip");
const imagemin = require("metalsmith-imagemin");
const debug = require("metalsmith-debug");
const sass = require("metalsmith-sass");
const livereload = require("metalsmith-livereload");
const watch = require("glob-watcher");

Handlebars.registerHelper("ifEqual", function(a, b, options) {
  if (a === b) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});
Handlebars.registerHelper("pluralize", function(n, singular, plural, options) {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`;
});
Handlebars.registerHelper("enforce", function(x, prop) {
  if (x[prop]) {
    return x[prop];
  }

  throw new Error(`Required value for ${prop} not found in ${x.path}`);
});

const build = done => {
  const ms = Metalsmith(__dirname)
    .metadata({
      sitename: "Creatio Podcast",
      siteurl: "https://www.creatiopodcast.com",
      description: "Creatio is a podcast about making"
    })
    .source("./src")
    .destination("./build")
    .clean(true)
    .use(
      collections({
        episodes: {
          pattern: "episodes/*.html"
        }
      })
    )
    .use(
      permalinks({
        relative: false,
        pattern: ":title",
        linksets: [
          {
            match: { collection: "episodes" },
            pattern: "episode/:episode-:title"
          }
        ]
      })
    )
    .use(layouts())
    .use(sass());

  if (process.env.ENV !== "production") {
    ms.use(livereload({ debug: true, delay: 100 }));
  }

  if (process.env.ENV === "production") {
    ms.use(imagemin());
    ms.use(gzip());
  }

  ms.use(debug()).build(err => {
    if (err) {
      console.error("Metalsmith build failed: ", err);
    }
    if ("function" === typeof done) {
      done();
    }
  });
};

if (process.env.ENV === "production") {
  build();
} else {
  watch("./src/**/*", { ignoreInitial: false }, build);
}
