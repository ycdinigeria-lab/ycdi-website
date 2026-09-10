module.exports = function (eleventyConfig) {
  // Only .njk and .md are treated as templates. Existing .html pages are copied untouched.
  eleventyConfig.setTemplateFormats(["njk", "md"]);

  // Pass through the existing static site, unchanged
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/*.html": "." });
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });

  // Readable date
  eleventyConfig.addFilter("readableDate", (d) => {
    const dt = d ? new Date(d) : new Date();
    return dt.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  });

  const live = (item) => item.data.published !== false;

  // Published blog posts, newest first
  eleventyConfig.addCollection("posts", (c) =>
    c.getFilteredByGlob("src/blog/*.md").filter(live).sort((a, b) => b.date - a.date)
  );

  // Photos flagged "Show in main gallery", pulled from published posts
  eleventyConfig.addCollection("galleryItems", (c) => {
    const out = [];
    c.getFilteredByGlob("src/blog/*.md").filter(live).forEach((p) => {
      (p.data.gallery || []).forEach((g) => {
        if (g && g.image && g.showInMainGallery) {
          out.push({
            image: g.image, caption: g.caption || "", alt: g.alt || g.caption || "",
            category: p.data.category || "General", postUrl: p.url, postTitle: p.data.title
          });
        }
      });
    });
    return out;
  });

  // Distinct categories for the gallery filter
  eleventyConfig.addCollection("galleryCategories", (c) => {
    const s = new Set();
    c.getFilteredByGlob("src/blog/*.md").filter(live).forEach((p) => {
      (p.data.gallery || []).forEach((g) => { if (g && g.showInMainGallery) s.add(p.data.category || "General"); });
    });
    return [...s];
  });

  return { dir: { input: "src", output: "_site", includes: "_includes", data: "_data" } };
};
