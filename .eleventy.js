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

  // First N items of a list
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  // Only items that have a photo set
  eleventyConfig.addFilter("withImage", (arr) => (arr || []).filter((i) => i && i.image));

  // Text before the first occurrence of a separator ("Ilesa, Osun" -> "Ilesa")
  eleventyConfig.addFilter("before", (s, sep) => String(s || "").split(sep)[0].trim());

  // Count of distinct states across chapter items (drives the "States" stat)
  eleventyConfig.addFilter("uniqueStates", (items) =>
    [...new Set((items || []).map((i) => (i.state || "").trim()).filter(Boolean))].length
  );

  // Count of distinct countries (for when YCDI grows beyond Nigeria)
  eleventyConfig.addFilter("uniqueCountries", (items) =>
    [...new Set((items || []).map((i) => (i.country || "").trim()).filter(Boolean))].length
  );

  // 5000 -> "5,000"
  eleventyConfig.addFilter("thousands", (n) =>
    Number(n || 0).toLocaleString("en-GB")
  );

  // Turn a plain-text field with blank lines into paragraphs
  eleventyConfig.addFilter("paragraphs", (text) => {
    if (!text) return "";
    return String(text)
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  });

  // Render a markdown string (used by editable programme bodies)
  const md = require("markdown-it")({ html: true, linkify: true, breaks: false });
  eleventyConfig.addFilter("md", (s) => (s ? md.render(String(s)) : ""));

  // Split events into upcoming and past against the build date, sorted sensibly
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  eleventyConfig.addFilter("upcomingEvents", (items) =>
    (items || [])
      .filter((e) => e.date && new Date(e.date) >= startOfToday())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  );
  eleventyConfig.addFilter("pastEvents", (items) =>
    (items || [])
      .filter((e) => e.date && new Date(e.date) < startOfToday())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  );

  return { dir: { input: "src", output: "_site", includes: "_includes", data: "_data" } };
};
