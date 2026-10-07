// The ordinary pages in src/ (About, Chapters, Contact and so on), for the sitemap.
// The blog, its categories, its posts and the chapter pages are added by the sitemap template itself.
const fs = require("fs");
const path = require("path");

const skip = ["index", "blog", "blog-category", "chapter", "feed", "sitemap", "robots", "thanks"];

module.exports = () => {
  const names = fs.readdirSync(path.join(__dirname, ".."))
    .filter((f) => f.endsWith(".html") || f.endsWith(".njk"))
    .map((f) => f.replace(/\.(html|njk)$/, ""))
    .filter((name) => !skip.includes(name));
  return [...new Set(names)].sort();
};
