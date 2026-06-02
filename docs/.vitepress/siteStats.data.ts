// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';
// @ts-ignore
import {fileURLToPath} from 'node:url';

type SiteStatsData = {
    totalWords: number;
    latestUpdatedDate: string;
};

// @ts-ignore
const vitepressDir = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(vitepressDir, '..');
const columnDir = path.resolve(docsDir, 'column');

function walkMarkdownFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const entries = fs.readdirSync(dir, {withFileTypes: true});
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walkMarkdownFiles(fullPath));
            continue;
        }

        if (entry.isFile() && fullPath.endsWith('.md')) {
            files.push(fullPath);
        }
    }

    return files;
}

function stripFrontmatter(content: string): string {
    return content.replace(/^---[\r\n]+[\s\S]*?[\r\n]---[\r\n]?/, '');
}

function markdownToPlainText(content: string): string {
    return stripFrontmatter(content)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`\n]+`/g, ' ')
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\|/g, ' ')
        .replace(/[*_~#>-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function countWords(text: string): number {
    const chineseChars = text.match(/[\u3400-\u9fff]/g) || [];
    const latinWords = text
        .replace(/[\u3400-\u9fff]/g, ' ')
        .match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];

    return chineseChars.length + latinWords.length;
}

function formatDate(value: number): string {
    const date = new Date(value);
    const year = date.getFullYear();
    // @ts-ignore
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // @ts-ignore
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default {
    watch: 'column/**/*.md',
    load(watchedFiles): SiteStatsData {
        const files = (watchedFiles && watchedFiles.length > 0
            ? watchedFiles.map((file) => path.isAbsolute(file) ? file : path.resolve(docsDir, file))
            : walkMarkdownFiles(columnDir))
            .filter((file) => file.endsWith('.md'));

        let totalWords = 0;
        let latestUpdated = 0;

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            totalWords += countWords(markdownToPlainText(content));

            const mtime = fs.statSync(file).mtimeMs;
            if (mtime > latestUpdated) {
                latestUpdated = mtime;
            }
        }

        return {
            totalWords,
            latestUpdatedDate: latestUpdated ? formatDate(latestUpdated) : '未记录'
        };
    }
};
