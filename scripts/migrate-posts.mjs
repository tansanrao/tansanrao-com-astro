import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const SOURCE_DIR = 'temp/posts';
const TARGET_DIR = 'src/content/blog';

async function migratePost(filename) {
  const source = await fs.readFile(path.join(SOURCE_DIR, filename), 'utf-8');
  const { data, content } = matter(source);
  
  // Transform frontmatter to match Astro schema
  const newFrontmatter = {
    title: data.title || '',
    description: data.description || '',
    pubDate: data.date || new Date(),
    tags: Array.isArray(data.tags) 
      ? data.tags 
      : typeof data.tags === 'string'
        ? data.tags.split(',').map(t => t.trim())
        : [],
    draft: Boolean(data.draft),
    authors: [{ name: 'Tanuj Ravi Rao', url: 'https://tansanrao.com' }]
  };

  // Only add optional fields if they exist
  if (data.updated) {
    newFrontmatter.updatedDate = data.updated;
  }
  if (data.heroImage) {
    newFrontmatter.heroImage = data.heroImage;
  }

  // Create new markdown content
  const newContent = matter.stringify(content.trim(), newFrontmatter);
  
  // Keep the original .md extension
  const targetFilename = filename;
  
  // Ensure target directory exists
  await fs.mkdir(TARGET_DIR, { recursive: true });
  
  // Write the new file
  await fs.writeFile(path.join(TARGET_DIR, targetFilename), newContent);
  
  console.log(`Migrated ${filename}`);
}

async function migrateAllPosts() {
  try {
    const files = await fs.readdir(SOURCE_DIR);
    const markdownFiles = files.filter(f => f.endsWith('.md') && !f.includes('.11tydata'));
    
    for (const file of markdownFiles) {
      await migratePost(file);
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateAllPosts(); 