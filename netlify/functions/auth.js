// Starts the GitHub OAuth login for Sveltia CMS. Secret stays in Netlify env vars.
exports.handler = async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return { statusCode: 500, body: "Missing GITHUB_CLIENT_ID" };
  const host = event.headers.host;
  const redirectUri = `https://${host}/callback`;
  const state = Math.random().toString(36).slice(2);
  const url =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&scope=repo" +
    `&state=${state}`;
  return { statusCode: 302, headers: { Location: url }, body: "" };
};
