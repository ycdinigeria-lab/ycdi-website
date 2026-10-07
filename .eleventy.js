module.exports = function (eleventyConfig) {
  // Only .njk and .md are treated as templates. Existing .html pages are copied untouched.
  eleventyConfig.setTemplateFormats(["njk", "md"]);

  // Pass through the existing static site, unchanged
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  // about.html is now generated from about.njk so its chapter figures come from the Chapters list.
  eleventyConfig.addPassthroughCopy({ "src/!(about).html": "." });
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


  // ============================================================
  // Blog: dates, reading time, categories, related posts, clean URLs
  // ============================================================
  const fs = require("fs");

  // 2026-01-20 (for <time datetime> and the sitemap) and full ISO (feed, meta tags)
  eleventyConfig.addFilter("isoDate", (d) => (d ? new Date(d) : new Date()).toISOString().slice(0, 10));
  eleventyConfig.addFilter("isoDateTime", (d) => (d ? new Date(d) : new Date()).toISOString());

  // Minutes to read a post, from its Markdown file (about 200 words a minute, never under 1)
  const readCache = {};
  eleventyConfig.addFilter("readingTime", (inputPath) => {
    if (!inputPath) return 1;
    if (readCache[inputPath]) return readCache[inputPath];
    let n = 1;
    try {
      const raw = fs.readFileSync(inputPath, "utf8").replace(/^---[\s\S]*?---/, "");
      const words = raw.replace(/<[^>]*>/g, " ").replace(/[#>*_`\[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
      n = Math.max(1, Math.ceil(words / 200));
    } catch (e) { n = 1; }
    readCache[inputPath] = n;
    return n;
  });

  // "School Outreach" -> "school-outreach" (category page addresses)
  const catSlug = (s) =>
    String(s || "General").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  eleventyConfig.addFilter("catSlug", catSlug);

  // Posts in one category
  eleventyConfig.addFilter("inCategory", (posts, name) =>
    (posts || []).filter((p) => (p.data.category || "General") === name)
  );

  // Up to n other posts: same category first, then the most recent
  eleventyConfig.addFilter("relatedPosts", (posts, url, category, n) => {
    const others = (posts || []).filter((p) => p.url !== url);
    const same = others.filter((p) => (p.data.category || "General") === (category || "General"));
    const rest = others.filter((p) => !same.includes(p));
    return same.concat(rest).slice(0, n || 3);
  });

  // "/blog-x.html" -> "/blog-x", "/index.html" -> "/" (the address Netlify actually serves)
  eleventyConfig.addFilter("cleanUrl", (u) =>
    String(u || "/").replace(/\/index\.html$/, "/").replace(/\.html$/, "")
  );

  // Categories that have at least one published post, with a count, in A to Z order
  eleventyConfig.addCollection("postCategories", (c) => {
    const counts = {};
    c.getFilteredByGlob("src/blog/*.md").filter(live).forEach((p) => {
      const name = p.data.category || "General";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts).sort().map((name) => ({ name, slug: catSlug(name), count: counts[name] }));
  });

  // ============================================================
  // Audit fixes: single-source figures, chapter pages, structured data
  // ============================================================

  // 7 -> "seven" (figures written into sentences); falls back to digits above twenty
  const WORDS = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty"];
  eleventyConfig.addFilter("numWord", (n) => (WORDS[Number(n)] !== undefined ? WORDS[Number(n)] : String(n)));

  // "Ilesa, Osun" -> "ilesa" (chapter page addresses) and "Edo State" -> "Edo" (matches the map)
  const chapterSlug = (name) =>
    String(name || "").split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  eleventyConfig.addFilter("chapterSlug", chapterSlug);
  const stateKey = (s) => String(s || "").replace(/\s+State$/i, "").trim();
  eleventyConfig.addFilter("stateKey", stateKey);

  // States that have chapters, each with a count: [{ name: "Edo", count: 2 }, ...]
  eleventyConfig.addFilter("chapterStates", (items) => {
    const counts = {};
    (items || []).forEach((i) => { const k = stateKey(i.state); if (k) counts[k] = (counts[k] || 0) + 1; });
    return Object.keys(counts).sort().map((name) => ({ name, count: counts[name] }));
  });
  eleventyConfig.addFilter("stateCount", (states, name) => {
    const hit = (states || []).find((s) => s.name === name);
    return hit ? hit.count : 0;
  });

  // Safe JSON for <script type="application/ld+json"> blocks
  eleventyConfig.addFilter("ldjson", (obj) => JSON.stringify(obj).replace(/</g, "\\u003c"));

  return { dir: { input: "src", output: "_site", includes: "_includes", data: "_data" } };
};
