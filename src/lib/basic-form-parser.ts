import { load } from 'cheerio';
import { dataTypes } from '@/lib/schemas';

export interface ParsedField {
  fieldName: string;
  dataType: (typeof dataTypes)[number];
  label?: string;
}

const typeHeuristics: Record<string, (label: string) => (typeof dataTypes)[number]> = {
  email: () => 'EmailAddress',
  tel: () => 'PhoneNumber',
  phone: () => 'PhoneNumber',
  date: () => 'Date',
  datetime: () => 'DateTime',
  password: () => 'Password',
  number: () => 'RandomNumber',
  file: (l) => inferLabelDataType(l) ?? 'ImageURL',
};

const labelHeuristics: Array<{ keywords: string[]; dataType: (typeof dataTypes)[number] }> = [
  { keywords: ['first name', 'firstname', 'given name'], dataType: 'FirstName' },
  { keywords: ['last name', 'lastname', 'surname', 'family name'], dataType: 'LastName' },
  { keywords: ['full name', 'fullname', 'name'], dataType: 'FullName' },
  { keywords: ['email'], dataType: 'EmailAddress' },
  { keywords: ['phone', 'mobile', 'tel'], dataType: 'PhoneNumber' },
  { keywords: ['company', 'organisation', 'organization', 'employer'], dataType: 'CompanyName' },
  { keywords: ['job', 'occupation', 'position', 'title'], dataType: 'JobTitle' },
  { keywords: ['gender', 'sex'], dataType: 'Gender' },
  { keywords: ['hobby', 'hobbies', 'interest'], dataType: 'Word' },
  { keywords: ['photo', 'picture', 'image'], dataType: 'ImageURL' },
  { keywords: ['street', 'address line1', 'address line 1', 'addr'], dataType: 'StreetAddress' },
  { keywords: ['city', 'town'], dataType: 'City' },
  { keywords: ['state', 'province', 'region'], dataType: 'State/Province' },
  { keywords: ['country'], dataType: 'Country' },
  { keywords: ['address'], dataType: 'StreetAddress' },
  { keywords: ['zip', 'postal', 'postcode'], dataType: 'ZIP/Postal Code' },
  { keywords: ['dob', 'birth', 'birthday', 'date of birth'], dataType: 'DateOfBirth' },
];

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^([A-Z])/, (m) => m.toLowerCase());
}

function inferLabelDataType(lower: string): (typeof dataTypes)[number] | undefined {
  for (const rule of labelHeuristics) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.dataType;
  }
  return undefined;
}

function inferDataType(labelOrName: string, typeAttr?: string): (typeof dataTypes)[number] {
  const lower = labelOrName.toLowerCase();

  // HTML type attribute heuristic first
  if (typeAttr) {
    const t = typeAttr.toLowerCase();
    for (const key in typeHeuristics) {
      if (t.includes(key)) return typeHeuristics[key](labelOrName);
    }
  }

  const labelBased = inferLabelDataType(lower);
  if (labelBased) return labelBased;

  // default fallback
  return 'Word';
}

export function basicParseFormFields(html: string): ParsedField[] {
  const $ = load(html);
  const fields: ParsedField[] = [];

  // Parse simple inputs
  $('input, textarea, select').each((_idx, el) => {
    const elem = $(el);
    const tag = (elem.get(0) as any)?.tagName?.toLowerCase?.() ?? 'input';
    const type = (elem.attr('type') ?? '').toLowerCase();
    if (type === 'hidden') return;

    const id = elem.attr('id');
    const name = elem.attr('name');
    const aria = elem.attr('aria-label');
    const placeholder = elem.attr('placeholder');

    let labelText = '';
    if (id) {
      const label = $(`label[for="${id}"]`).first();
      if (label.length) labelText = label.text();
    }
    if (!labelText) {
      // Maybe parent label
      const parentLabel = elem.parents('label').first();
      if (parentLabel.length) labelText = parentLabel.text();
    }

    const rawName = name || id || placeholder || aria || labelText;
    if (!rawName) return;

    // Normalize specific patterns
    let fieldNameRaw = rawName.toLowerCase();
    let fieldName: string;
    if (fieldNameRaw.includes('address')) {
      fieldName = 'streetAddress';
    } else {
      fieldName = toCamelCase(rawName);
    }
    const dataType = inferDataType(labelText || rawName, type);

    // Special case: textarea with 'address' placeholder/label becomes streetAddress
    if (tag === 'textarea' && /(address)/i.test(placeholder + labelText + rawName)) {
      fields.push({ fieldName: 'streetAddress', dataType: 'StreetAddress', label: labelText || placeholder || '' });
      return;
    }

    // Deduplicate by fieldName
    if (!fields.some((f) => f.fieldName === fieldName)) {
      fields.push({ fieldName, dataType, label: labelText || placeholder || aria || '' });
    }
  });

  // Parse table-based forms (label in first <td>, control in second)
  $('tr').each((_i, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 2) return;
    const labelText = $(cells[0]).text().trim();
    const control = $(cells[1]).find('input, textarea, select').first();
    if (!control.length) return;
    const typeAttr = control.attr('type') ?? '';
    const rawName = control.attr('name') || control.attr('id') || labelText;
    if (!rawName) return;
    // Normalize specific patterns
    let fieldNameRaw = rawName.toLowerCase();
    let fieldName: string;
    if (fieldNameRaw.includes('address')) {
      fieldName = 'streetAddress';
    } else {
      fieldName = toCamelCase(rawName);
    }
    const dataType = inferDataType(labelText || rawName, typeAttr);
    if (!fields.some(f => f.fieldName === fieldName)) {
      fields.push({ fieldName, dataType, label: labelText });
    }
  });

  // Ensure hobbies field exists if keyword appears in HTML but not detected
  if (!fields.some(f => /hobb/i.test(f.fieldName)) && /hobbies?/i.test(html)) {
    fields.push({ fieldName: 'hobbies', dataType: 'Word', label: 'Hobbies' });
  }

  return fields;
}
