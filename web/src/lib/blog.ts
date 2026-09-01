import fs from "fs";
import path from "path";
import { remark } from "remark";
import html from "remark-html";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  
  return files
    .map((file) => {
      const filePath = path.join(BLOG_DIR, file);
      const source = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, content } = parseFrontmatter(source);
      
      return {
        slug: frontmatter.slug || file.replace(".md", ""),
        title: frontmatter.title || "Sin título",
        description: frontmatter.description || "",
        date: frontmatter.date || "",
        readTime: frontmatter.readTime || "5 min",
        content,
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  
  if (!fs.existsSync(filePath)) return null;
  
  const source = fs.readFileSync(filePath, "utf-8");
  const { frontmatter, content } = parseFrontmatter(source);
  
  return {
    slug: frontmatter.slug || slug,
    title: frontmatter.title || "Sin título",
    description: frontmatter.description || "",
    date: frontmatter.date || "",
    readTime: frontmatter.readTime || "5 min",
    content,
  };
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

interface Frontmatter {
  [key: string]: string;
}

function parseFrontmatter(source: string): {
  frontmatter: Frontmatter;
  content: string;
} {
  const frontmatter: Frontmatter = {};
  
  if (!source.startsWith("---")) {
    return { frontmatter, content: source };
  }
  
  const lines = source.split("\n");
  let endIndex = -1;
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return { frontmatter, content: source };
  }
  
  const fmLines = lines.slice(1, endIndex);
  const content = lines.slice(endIndex + 1).join("\n");
  
  for (const line of fmLines) {
    const match = line.match(/^(\w+)\s*:\s*["']?([^"']+)["']?$/);
    if (match) {
      frontmatter[match[1]] = match[2];
    }
  }
  
  return { frontmatter, content };
}
