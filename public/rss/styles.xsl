<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          :root {
            color-scheme: light dark;
            
            /* Light theme */
            --light-bg: #FFFCF0;
            --light-bg-2: #F2F0E5;
            --light-ui: #E6E4D9;
            --light-ui-2: #DAD8CE;
            --light-tx: #100F0F;
            --light-tx-2: #6F6E69;
            --light-tx-3: #878580;
            --light-pu: #6C3082;
            
            /* Dark theme */
            --dark-bg: #100F0F;
            --dark-bg-2: #1C1B1A;
            --dark-ui: #282726;
            --dark-ui-2: #343331;
            --dark-tx: #FFFCF0;
            --dark-tx-2: #878580;
            --dark-tx-3: #6F6E69;
            --dark-pu: #9D86B3;
          }

          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.5;
            max-width: 64rem;
            margin: 0 auto;
            padding: 2rem 1rem;
            background: var(--light-bg);
            color: var(--light-tx);
          }

          @media (prefers-color-scheme: dark) {
            body {
              background: var(--dark-bg);
              color: var(--dark-tx);
            }
          }

          header {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--light-ui);
          }

          @media (prefers-color-scheme: dark) {
            header {
              border-bottom-color: var(--dark-ui);
            }
          }

          h1 {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            color: var(--light-tx);
          }

          @media (prefers-color-scheme: dark) {
            h1 {
              color: var(--dark-tx);
            }
          }

          .description {
            margin-top: 0.5rem;
            color: var(--light-tx-2);
          }

          @media (prefers-color-scheme: dark) {
            .description {
              color: var(--dark-tx-2);
            }
          }

          .feeds {
            margin-top: 1rem;
          }

          .feeds a {
            color: var(--light-pu);
            text-decoration: none;
            margin-right: 1rem;
          }

          @media (prefers-color-scheme: dark) {
            .feeds a {
              color: var(--dark-pu);
            }
          }

          .item {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: var(--light-bg-2);
            border: 1px solid var(--light-ui);
            border-radius: 0.5rem;
          }

          @media (prefers-color-scheme: dark) {
            .item {
              background: var(--dark-bg-2);
              border-color: var(--dark-ui);
            }
          }

          .item h2 {
            margin: 0;
            font-size: 1.5rem;
          }

          .item h2 a {
            color: var(--light-tx);
            text-decoration: none;
          }

          .item h2 a:hover {
            color: var(--light-pu);
          }

          @media (prefers-color-scheme: dark) {
            .item h2 a {
              color: var(--dark-tx);
            }
            .item h2 a:hover {
              color: var(--dark-pu);
            }
          }

          .item .meta {
            margin-top: 0.5rem;
            color: var(--light-tx-2);
            font-size: 0.875rem;
          }

          @media (prefers-color-scheme: dark) {
            .item .meta {
              color: var(--dark-tx-2);
            }
          }

          .item .content {
            margin-top: 1rem;
            color: var(--light-tx-2);
          }

          @media (prefers-color-scheme: dark) {
            .item .content {
              color: var(--dark-tx-2);
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p class="description"><xsl:value-of select="/rss/channel/description"/></p>
          <div class="feeds">
            <xsl:for-each select="/rss/channel/atom:link[@rel='alternate']">
              <a href="{@href}"><xsl:value-of select="@title"/></a>
            </xsl:for-each>
          </div>
        </header>
        <main>
          <xsl:for-each select="/rss/channel/item">
            <article class="item">
              <h2>
                <a href="{link}"><xsl:value-of select="title"/></a>
              </h2>
              <div class="meta">
                <time><xsl:value-of select="pubDate"/></time>
              </div>
              <div class="content">
                <xsl:choose>
                  <xsl:when test="description != ''">
                    <xsl:value-of select="description"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="content:encoded" disable-output-escaping="yes"/>
                  </xsl:otherwise>
                </xsl:choose>
              </div>
            </article>
          </xsl:for-each>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet> 