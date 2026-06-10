export function parseAuditArgs(argv) {
  let json = false;
  let markdown = false;
  const itemIds = [];

  for (const arg of argv) {
    if (arg === '--json') {
      json = true;
    } else if (arg === '--markdown') {
      markdown = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      itemIds.push(arg);
    }
  }

  if (json && markdown) {
    throw new Error('Cannot specify both --json and --markdown');
  }

  if (itemIds.length === 0) {
    throw new Error('No legacy item IDs provided');
  }

  return { json, markdown, itemIds };
}

export function generateFieldClassifications(legacyData) {
  const classifications = [];
  const warnings = [];

  if (!legacyData) {
    return { classifications, warnings: ['Legacy data is missing, cannot classify fields.'] };
  }

  for (const key of Object.keys(legacyData)) {
    let status = null;
    if (key === 'bluetoothTags') {
      status = 'preserved-as-raw-snapshot';
    } else if (key === 'tagType') {
      status = 'preserved-as-legacy-reference';
    } else if (['id', 'createdAt', 'updatedAt'].includes(key)) {
      status = 'derived-only';
    } else if (['imageUrl', 'imageId', 'ownerId', 'location', 'name', 'description'].includes(key)) {
      status = 'migrated';
    }

    if (status) {
      classifications.push({ field: key, status });
    } else {
      warnings.push(`Field '${key}' could not be safely classified. Expected project vocabulary only.`);
    }
  }
  return { classifications, warnings };
}

export function shapeAuditSummary(
  legacyItemId,
  expectedNormalizedObjectId,
  legacyData,
  objData,
  bindingsSize,
  imagesSize,
  eventsSize
) {
  const legacyItemExists = !!legacyData;
  const normalizedObjectExists = !!objData;
  const legacyItemIdMatches = normalizedObjectExists && objData.legacy?.legacyItemId === legacyItemId;
  const ownerIdPresent = normalizedObjectExists && !!objData.ownerId;
  const primaryImageUrlPresent = normalizedObjectExists && !!objData.primaryImageUrl;
  const primaryImageIdPresent = normalizedObjectExists && !!objData.primaryImageId;

  const bluetoothTagsExists = legacyItemExists && Array.isArray(legacyData.bluetoothTags);
  const countBluetoothTags = bluetoothTagsExists ? legacyData.bluetoothTags.length : 0;

  const tagTypeExists = legacyItemExists && ('tagType' in legacyData);
  const tagTypeValue = tagTypeExists ? String(legacyData.tagType) : null;

  const { classifications, warnings: fieldWarnings } = generateFieldClassifications(legacyData);

  const warnings = [...fieldWarnings];

  if (!legacyItemExists) warnings.push('Legacy item does not exist.');
  if (!normalizedObjectExists) warnings.push('Normalized object does not exist.');
  if (normalizedObjectExists && !legacyItemIdMatches) warnings.push('Normalized object legacy reference mismatched or missing.');
  if (normalizedObjectExists && !ownerIdPresent) warnings.push('ownerId missing on normalized object.');

  return {
    legacyItemId,
    expectedNormalizedObjectId,
    legacyItemExists,
    normalizedObjectExists,
    legacyItemIdMatches,
    ownerIdPresent,
    primaryImageUrlPresent,
    primaryImageIdPresent,
    countObjectIdentifierBindings: bindingsSize,
    countObjectImages: imagesSize,
    countObjectEvents: eventsSize,
    bluetoothTagsExists,
    countBluetoothTags,
    tagTypeExists,
    tagTypeValue,
    warnings,
    recommendedFieldClassifications: classifications,
  };
}

export function formatJsonOutput(summaries) {
  return JSON.stringify(summaries, null, 2);
}

export function formatMarkdownOutput(summaries) {
  let md = `# Legacy Items Audit Checklist\n\n`;
  for (const summary of summaries) {
    md += `## Item: \`${summary.legacyItemId}\`\n\n`;
    md += `- [ ] **Legacy Item Exists**: ${summary.legacyItemExists ? 'Yes' : 'No'}\n`;
    md += `- [ ] **Normalized Object Exists**: ${summary.normalizedObjectExists ? 'Yes' : 'No'} (\`${summary.expectedNormalizedObjectId}\`)\n`;
    md += `- [ ] **Legacy ID Matches**: ${summary.legacyItemIdMatches ? 'Yes' : 'No'}\n`;
    md += `- [ ] **Owner ID Present**: ${summary.ownerIdPresent ? 'Yes' : 'No'}\n`;
    md += `- [ ] **Primary Image**: URL: ${summary.primaryImageUrlPresent ? 'Yes' : 'No'}, ID: ${summary.primaryImageIdPresent ? 'Yes' : 'No'}\n`;
    md += `- [ ] **Bindings Count**: ${summary.countObjectIdentifierBindings}\n`;
    md += `- [ ] **Images Count**: ${summary.countObjectImages}\n`;
    md += `- [ ] **Events Count**: ${summary.countObjectEvents}\n`;
    md += `- [ ] **Bluetooth Tags**: ${summary.bluetoothTagsExists ? `Yes (${summary.countBluetoothTags} tags)` : 'No'}\n`;
    md += `- [ ] **Tag Type**: ${summary.tagTypeExists ? `Yes (\`${summary.tagTypeValue}\`)` : 'No'}\n\n`;

    if (summary.warnings.length > 0) {
      md += `### ⚠️ Warnings\n`;
      for (const w of summary.warnings) {
        md += `- ${w}\n`;
      }
      md += `\n`;
    }

    if (summary.recommendedFieldClassifications.length > 0) {
      md += `### Recommended Field Classifications\n`;
      md += `| Field | Recommended Status |\n`;
      md += `|---|---|\n`;
      for (const cls of summary.recommendedFieldClassifications) {
        md += `| \`${cls.field}\` | \`${cls.status}\` |\n`;
      }
      md += `\n`;
    }
  }
  return md.trim();
}
