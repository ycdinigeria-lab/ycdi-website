// Completes the GitHub OAuth login and hands the token back to the CMS window.
exports.handler = async (event) => {
  const code = (event.queryStringParameters || {}).code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { statusCode: 500, body: "Missing GitHub OAuth env vars" };

  let payload;
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const data = await res.json();
    payload = data.access_token
      ? "success:" + JSON.stringify({ token: data.access_token, provider: "github" })
      : "error:" + JSON.stringify(data);
  } catch (e) {
    payload = "error:" + JSON.stringify({ message: String(e) });
  }

  const html = `<!doctype html><html><body><script>
    (function () {
      function send(e) {
        window.opener && window.opener.postMessage("authorization:github:${payload.startsWith('success') ? 'success' : 'error'}:" + ${JSON.stringify(payload.replace(/^success:|^error:/, ""))}, "*");
        window.removeEventListener("message", send);
      }
      window.addEventListener("message", send, false);
      window.opener && window.opener.postMessage("authorizing:github", "*");
    })();
  </script><p>Completing sign-in…</p></body></html>`;
  return { statusCode: 200, headers: { "Content-Type": "text/html" }, body: html };
};
