module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) =>
      data.published === false ? false : `blog-${data.page.fileSlug}.html`,
    eleventyExcludeFromCollections: (data) => data.published === false
  }
};
