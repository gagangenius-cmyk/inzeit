const data = require('D:/xampp/htdocs/dm-next/model_metadata.json');

const withTimestamps = data.filter(m => m.timestamps === 'true');
const withEnums = data.filter(m => m.enums && m.enums.length > 0);
const withFieldMappings = data.filter(m => m.fieldMappings && m.fieldMappings.length > 0);
const withUnique = data.filter(m => m.unique && m.unique.length > 0);
const withAssociations = data.filter(m => m.associations && m.associations.length > 0);
const bigModels = data.filter(m => m.columnCount > 20).sort((a,b) => b.columnCount - a.columnCount);

console.log('=== MODELS WITH timestamps: true ===');
withTimestamps.forEach(m => console.log(m.table + ' (' + m.class + ')'));

console.log('\n=== MODELS WITH ENUM COLUMNS ===');
withEnums.forEach(m => console.log(m.table + ' (' + m.class + '): ' + m.enums.join('; ')));

console.log('\n=== MODELS WITH FIELD MAPPINGS ===');
withFieldMappings.forEach(m => console.log(m.table + ' (' + m.class + '): ' + m.fieldMappings.join('; ')));

console.log('\n=== MODELS WITH UNIQUE CONSTRAINTS ===');
withUnique.forEach(m => console.log(m.table + ' (' + m.class + '): ' + m.unique));

console.log('\n=== LARGEST MODELS (by column count) ===');
bigModels.forEach(m => console.log(m.table + ' (' + m.class + '): ' + m.columnCount + ' cols'));

console.log('\n=== MODELS WITH CUSTOM PK !== id ===');
data.filter(m => m.pk && m.pk !== 'id').forEach(m => console.log(m.table + ' (' + m.class + '): PK=' + m.pk));

console.log('\n=== MOST REFERENCED MODELS IN ASSOCIATIONS ===');
const assocMap = {};
withAssociations.forEach(m => {
    m.associations.forEach(a => {
        const target = a.match(/-> (\w+)/);
        if (target) {
            assocMap[target[1]] = (assocMap[target[1]] || 0) + 1;
        }
    });
});
const sorted = Object.entries(assocMap).sort((a,b) => b[1] - a[1]);
sorted.forEach(([k,v]) => console.log(k + ': ' + v + ' references'));
