module.exports = {
  name: "YCDI",
  fullName: "Young Christian Development Initiative",
  description: "A faith-based Nigerian NGO reaching young people across six states through school outreach, discipleship, mentorship and scholarships.",
  // Netlify sets URL to the live site (netlify.app now, custom domain later). Nothing hard-coded.
  url: (process.env.URL || "https://ycdinigeria.netlify.app").replace(/\/$/, ""),
  defaultImage: "/assets/photos/gallery-2.jpg"
};
