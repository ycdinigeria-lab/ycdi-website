// Settings shared by every blog post in this folder.
const clean = (u) => String(u || "/").replace(/\/index\.html$/, "/").replace(/\.html$/, "");
const iso = (d) => (d ? new Date(d) : new Date()).toISOString();

module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) =>
      data.published === false ? false : `blog-${data.page.fileSlug}.html`,
    eleventyExcludeFromCollections: (data) => data.published === false,

    // Structured data for search engines: the article itself and its breadcrumb trail.
    jsonLd: (data) => {
      if (data.published === false || !data.site || !data.page || !data.page.url) return "";
      const base = data.site.url;
      const url = base + clean(data.page.url);
      const author = data.author && data.author !== "YCDI Team"
        ? { "@type": "Person", name: data.author }
        : { "@type": "Organization", name: data.site.fullName, url: base + "/" };
      const graph = [
        {
          "@type": "BlogPosting",
          headline: data.title,
          description: data.seoDescription || data.excerpt || "",
          image: [base + (data.featuredImage || data.site.defaultImage)],
          datePublished: iso(data.page.date),
          dateModified: iso(data.updated || data.page.date),
          articleSection: data.category || "General",
          keywords: (data.tags || []).join(", "),
          inLanguage: "en-GB",
          author,
          publisher: {
            "@type": "Organization",
            name: data.site.fullName,
            url: base + "/",
            logo: { "@type": "ImageObject", url: base + "/assets/ycdi-crest.png" }
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url }
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: base + "/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: base + "/blog" },
            { "@type": "ListItem", position: 3, name: data.title, item: url }
          ]
        }
      ];
      return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
    }
  }
};
