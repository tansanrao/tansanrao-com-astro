import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
	const text = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes" />
  <xsl:template match="/">
    <html dir="ltr">

    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Subscription | <xsl:value-of select="atom:feed/atom:title" /></title>
      <link rel="stylesheet" href="/feed.css" />
      <link rel="icon" type="image/x-icon" href="{atom:feed/atom:icon}" />
    </head>

    <body>
      <header>
        <h1>
          <a href="{atom:feed/atom:link[@rel='alternate']/@href}">
            <xsl:value-of select="atom:feed/atom:title" />
          </a>
        </h1>
        <p>
          <xsl:value-of select="atom:feed/atom:subtitle" />
        </p>
      </header>

      <blockquote>
        <p>This page is an Atom format content subscription source.</p>
        <p>You can add the current address in any supported reader to subscribe to this content and get the latest content updates in time.</p>
        <p>
          Subscription address:
          <code id="feed-url"><xsl:value-of select="concat(atom:feed/atom:link[@rel='alternate']/@href, 'feed.xml')" /></code>
          <button type="button" onclick="copy()" class="copy-btn">Copy</button>
        </p>
      </blockquote>

      <script>
        function copy() {
          const URL = document.getElementById('feed-url').textContent;
          navigator.clipboard.writeText(URL).then(() => alert('Subscription address copied to clipboard!')).catch((() => alert('Copy failed, please copy the subscription address manually.')));
        }
      </script>

      <main>
        <xsl:for-each select="atom:feed/atom:entry">
          <section>
            <article>
              <a href="{atom:link/@href}">
                <xsl:value-of select="atom:title" />
              </a>
              <time>
                <xsl:value-of select="substring(atom:updated, 1, 10)" />
                <xsl:text> </xsl:text>
                <xsl:value-of select="substring(atom:updated, 12, 8)" />
              </time>
            </article>
            <xsl:if test="atom:category">
              <aside>
                <xsl:for-each select="atom:category">
                  <span>#<xsl:value-of select="@term" /></span>
                </xsl:for-each>
              </aside>
            </xsl:if>
          </section>
        </xsl:for-each>
      </main>

      <footer>
        <p>This is the feed page. Visit <a href="{atom:feed/atom:link[@rel='alternate']/@href}"><xsl:value-of select="atom:feed/atom:title" /></a> for the full website experience.</p>
        <p>
          Last updated:
          <xsl:value-of select="substring(atom:feed/atom:updated, 1, 10)" />
          <xsl:text> </xsl:text>
          <xsl:value-of select="substring(atom:feed/atom:updated, 12, 8)" />
        </p>
        <p><xsl:value-of select="atom:feed/atom:rights" /></p>
      </footer>
    </body>

    </html>
  </xsl:template>
</xsl:stylesheet>`;

	return new Response(text, { headers: { "Content-Type": "text/xsl" } });
};
