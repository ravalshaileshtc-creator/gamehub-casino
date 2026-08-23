/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const files = walk(apiDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix imports
    if (content.includes('NextRequest') && !content.includes("import { NextRequest")) {
        if (content.includes("import { NextResponse } from 'next/server'")) {
            content = content.replace("import { NextResponse } from 'next/server'", "import { NextRequest, NextResponse } from 'next/server'");
            changed = true;
        } else if (content.includes("import { NextResponse } from \"next/server\"")) {
            content = content.replace("import { NextResponse } from \"next/server\"", "import { NextRequest, NextResponse } from \"next/server\"");
            changed = true;
        }
    }

    // Fix catch blocks with error.message
    const catchRegex = /catch\s*\((error|e)\)\s*{[\s\S]*?(error|e)\.message/g;
    if (catchRegex.test(content)) {
        // This is simplified. For more reliability, we'd use a parser.
        // But let's try a safe replacement for common pattern.
        content = content.replace(/return NextResponse\.json\(\s*{\s*([^}]*?)error:\s*(error|e)\.message\s*([^}]*?)}\s*,\s*{\s*status:\s*500\s*}\s*\)/g, (match, p1, p2, p3) => {
            return `return NextResponse.json({ ${p1}error: ${p2} instanceof Error ? ${p2}.message : 'An error occurred' ${p3} }, { status: 500 })`;
        });
        changed = true;
    }

    if (changed) {
        console.log(`Updated ${file}`);
        fs.writeFileSync(file, content);
    }
});
