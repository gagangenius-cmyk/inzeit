const fs = require('fs');
const path = require('path');

const modelsDir = 'D:/xampp/htdocs/dm-next/src/models';
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'init.ts').sort();

const results = [];

for (const file of files) {
    const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
    
    const classMatch = content.match(/class\s+(\w+)\s+extends\s+Model/);
    const className = classMatch ? classMatch[1] : '';
    
    const tableMatch = content.match(/tableName:\s*'([^']+)'/);
    const tableName = tableMatch ? tableMatch[1] : '';
    
    const tsMatch = content.match(/timestamps:\s*(true|false)/);
    const timestamps = tsMatch ? tsMatch[1] : 'false';
    
    const initMatch = content.match(/\.init\s*\(\s*\{/);
    let columns = [];
    let enums = [];
    let pkCol = '';
    let fieldMappings = [];
    let allColDefs = [];
    
    if (initMatch) {
        const startIdx = initMatch.index;
        let braceCount = 0;
        let inInit = false;
        let initContent = '';
        for (let i = startIdx; i < content.length; i++) {
            const ch = content[i];
            if (ch === '(') { braceCount++; inInit = true; }
            if (inInit) initContent += ch;
            if (ch === ')') { braceCount--; if (braceCount === 0 && inInit) break; }
        }
        
        const firstBrace = initContent.indexOf('{');
        const lastBrace = initContent.lastIndexOf('}');
        
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            let colsSection = initContent.substring(firstBrace + 1, lastBrace);
            
            let depth = 0;
            let currentCol = '';
            let colParts = [];
            let inString = false;
            let stringChar = '';
            
            for (let i = 0; i < colsSection.length; i++) {
                const ch = colsSection[i];
                
                if (inString) {
                    currentCol += ch;
                    if (ch === stringChar && (i === 0 || colsSection[i-1] !== '\\')) {
                        inString = false;
                    }
                    continue;
                }
                
                if (ch === "'" || ch === '"') {
                    inString = true;
                    stringChar = ch;
                    currentCol += ch;
                    continue;
                }
                
                if (ch === '{' || ch === '(') depth++;
                if (ch === '}' || ch === ')') depth--;
                
                if (ch === ',' && depth === 0) {
                    colParts.push(currentCol.trim());
                    currentCol = '';
                } else {
                    currentCol += ch;
                }
            }
            if (currentCol.trim() !== '') colParts.push(currentCol.trim());
            allColDefs = colParts;
            
            for (const colDef of colParts) {
                const nameMatch = colDef.match(/^\s*(\w+)\s*:/);
                if (!nameMatch) continue;
                const colName = nameMatch[1];
                
                const typeMatch = colDef.match(/type:\s*(DataTypes\.\w+(?:\([^)]*\))?)/);
                const colType = typeMatch ? typeMatch[1] : '';
                
                const enumMatch = colDef.match(/DataTypes\.ENUM\(([^)]+)\)/);
                if (enumMatch) {
                    enums.push(colName + ': ' + enumMatch[1]);
                }
                
                if (colDef.match(/primaryKey:\s*true/)) {
                    pkCol = colName;
                }
                
                const fieldMatch = colDef.match(/field:\s*['"]?([^'"\s,}]+)['"]?/);
                if (fieldMatch && fieldMatch[1] !== colName) {
                    fieldMappings.push(colName + ' -> ' + fieldMatch[1]);
                }
                
                if (colType) {
                    columns.push(colName + ': ' + colType);
                }
            }
        }
    }
    
    const assocRegex = /(belongsTo|hasMany|hasOne|belongsToMany)\(\s*models\.(\w+),\s*\{[^}]*(?:foreignKey:\s*['"]?([^'"\s,}]+)['"]?)?[^}]*?\}\)/g;
    let assocMatch;
    const associations = [];
    while ((assocMatch = assocRegex.exec(content)) !== null) {
        associations.push(assocMatch[1] + ' -> ' + assocMatch[2] + (assocMatch[3] ? ' (FK: ' + assocMatch[3] + ')' : ''));
    }
    
    const uniqueCols = [];
    for (const colDef of allColDefs) {
        const nMatch = colDef.match(/^\s*(\w+)\s*:/);
        if (nMatch && colDef.match(/unique:\s*true/)) {
            uniqueCols.push(nMatch[1]);
        }
    }
    
    results.push({
        file: file,
        class: className,
        table: tableName,
        timestamps: timestamps,
        pk: pkCol,
        columnCount: columns.length,
        columns: columns,
        enums: enums,
        fieldMappings: fieldMappings,
        associations: associations,
        unique: uniqueCols.join(', ')
    });
}

const outPath = 'D:/xampp/htdocs/dm-next/model_metadata.json';
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log('Exported ' + results.length + ' models to ' + outPath);
