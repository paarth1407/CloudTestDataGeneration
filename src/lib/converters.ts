import * as yaml from 'js-yaml';

function escapeXml(str: string): string {
    return String(str).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export function jsonToXml(jsonString: string): string {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data)) {
            return "Error: XML conversion expects an array of JSON objects.";
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<records>\n';
        data.forEach(record => {
            xml += '  <record>\n';
            for (const key in record) {
                if (Object.prototype.hasOwnProperty.call(record, key)) {
                    const value = record[key];
                    const xmlKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    xml += `    <${xmlKey}>${escapeXml(String(value))}</${xmlKey}>\n`;
                }
            }
            xml += '  </record>\n';
        });
        xml += '</records>';
        return xml;
    } catch (error) {
        console.error("Error converting JSON to XML:", error);
        return "Error: Invalid JSON format provided for XML conversion.";
    }
}

export function jsonToCsv(jsonString: string): string {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data) || data.length === 0) {
            return "Error: CSV conversion requires a non-empty array of JSON objects."
        }
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] ?? '';
                const stringValue = String(value);

                if (/[",\n]/.test(stringValue)) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    } catch (error) {
        console.error("Error converting JSON to CSV:", error);
        return "Error: Invalid JSON format provided for CSV conversion.";
    }
}

function escapeSqlValue(val: any): string {
    if (val === null || typeof val === 'undefined') {
        return 'NULL';
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
    }
    // Escape single quotes by doubling them up
    return `'${String(val).replace(/'/g, "''")}'`;
}

export function jsonToSql(jsonString: string, tableName: string = 'test_data'): string {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data) || data.length === 0) {
            return "/* No data to generate SQL statements. */";
        }

        const headers = Object.keys(data[0]);
        const columns = headers.map(h => `\`${h}\``).join(', ');
        
        const createTableStmt = `CREATE TABLE \`${tableName}\` (\n` +
                                headers.map(h => `  \`${h}\` VARCHAR(255)`).join(',\n') +
                                `\n);\n\n`;

        let insertStatements = '';
        data.forEach(row => {
            const values = headers.map(header => escapeSqlValue(row[header])).join(', ');
            insertStatements += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        });

        return createTableStmt + insertStatements;
    } catch (error) {
        console.error("Error converting JSON to SQL:", error);
        return "/* Error: Invalid JSON format provided for SQL conversion. */";
    }
}

export function jsonToTsv(jsonString: string): string {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data) || data.length === 0) {
            return "Error: TSV conversion requires a non-empty array of JSON objects."
        }
        
        const headers = Object.keys(data[0]);
        const tsvRows = [headers.join('\t')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] ?? '';
                // For TSV, we mainly need to remove tabs and newlines from the data itself.
                return String(value).replace(/\s/g, ' ');
            });
            tsvRows.push(values.join('\t'));
        });
        
        return tsvRows.join('\n');
    } catch (error) {
        console.error("Error converting JSON to TSV:", error);
        return "Error: Invalid JSON format provided for TSV conversion.";
    }
}

export function jsonToYaml(jsonString: string): string {
    try {
        const data = JSON.parse(jsonString);
        return yaml.dump(data);
    } catch (error) {
        console.error("Error converting JSON to YAML:", error);
        return "Error: Invalid JSON format provided for YAML conversion.";
    }
}
