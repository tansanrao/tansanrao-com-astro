import { visit } from 'unist-util-visit';

export function remarkExtractFootnotes() {
  return function (tree, file) {
    const footnotes = [];
    
    // Find all footnote definitions
    visit(tree, 'footnoteDefinition', (node) => {
      footnotes.push({
        id: node.identifier,
        // Join all the text content from the footnote
        content: node.children
          .map(child => {
            if (child.type === 'paragraph') {
              return child.children
                .map(c => c.value || '')
                .join('')
                .trim();
            }
            return '';
          })
          .join(' ')
          .trim(),
      });
    });

    // Store footnotes in frontmatter
    if (!file.data.astro) {
      file.data.astro = {};
    }
    if (!file.data.astro.frontmatter) {
      file.data.astro.frontmatter = {};
    }
    file.data.astro.frontmatter.footnotes = footnotes;
  };
} 