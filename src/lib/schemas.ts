import { z } from 'zod';

export const dataTypeGroups = {
  "Personal Data": ['FirstName', 'LastName', 'FullName', 'Gender', 'Age', 'DateOfBirth'],
  "Contact Information": ['EmailAddress', 'PhoneNumber', 'MobileNumber'],
  "Address Data": ['StreetAddress', 'City', 'State/Province', 'Country', 'ZIP/Postal Code'],
  "Network Data": ['IPv4Address', 'IPv6Address', 'MACAddress', 'URL', 'DomainName'],
  "Visual Data": ['ColorHex', 'ColorName', 'ImageURL'],
  "Business Data": ['CompanyName', 'JobTitle', 'Department', 'EmployeeID'],
  "Financial Data": ['CreditCardNumber', 'BankAccountNumber', 'Currency', 'Price'],
  "Text Data": ['RandomText', 'LoremIpsum', 'Sentence', 'Paragraph', 'Word'],
  "Numeric Data": ['RandomNumber', 'IntegerRange', 'Decimal', 'Percentage'],
  "Date/Time": ['Date', 'Time', 'DateTime', 'Timestamp', 'UnixTimestamp'],
  "Identifiers": ['UUID', 'GUID', 'RandomID', 'Username', 'Password'],
  "Boolean Data": ['Boolean', 'YesNo', 'TrueFalse', 'ActiveInactive'],
};

// Flatten the groups into a single array for Zod enum validation
export const dataTypes = Object.values(dataTypeGroups).flat() as [string, ...string[]];

export const dateFormats = [
  // Date only
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'Month D, YYYY',
  'MM/DD/YY',
  'MM/YYYY',
  // Timestamp – 24-hour clock
  'MM/DD/YYYY HH:mm:ss',
  'DD/MM/YYYY HH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'Month D, YYYY HH:mm:ss',
  // Timestamp – 12-hour clock with AM/PM
  'MM/DD/YYYY hh:mm:ss A',
  'DD/MM/YYYY hh:mm:ss A',
  'YYYY-MM-DD hh:mm:ss A',
  'Month D, YYYY hh:mm:ss A'
];

export const locales = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Japan', 'India', 'Brazil', 'Mexico', 'China'
] as const;

export const formSchema = z.object({
  fields: z.array(
    z.object({
      fieldName: z.string().min(1, "Field name cannot be empty."),
      dataType: z.enum(dataTypes),
      emailDomain: z.string().optional(),
      dateFormat: z.string().optional(),
    })
  ).min(1, "You must add at least one field.").max(50, "You can add a maximum of 50 fields."),
  numberOfRows: z.coerce.number().int().min(1, "You must generate at least 1 row.").max(10000, "You can generate a maximum of 10,000 rows."),
  locale: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
