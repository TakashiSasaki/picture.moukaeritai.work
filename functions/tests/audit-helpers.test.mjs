import { describe, it, expect } from 'vitest';
import {
  parseAuditArgs,
  generateFieldClassifications,
  shapeAuditSummary,
  formatJsonOutput,
  formatMarkdownOutput
} from '../scripts/audit-helpers.mjs';

describe('audit-helpers', () => {
  it('parses arguments correctly', () => {
    expect(parseAuditArgs(['--json', 'item1', 'item2'])).toEqual({ json: true, markdown: false, itemIds: ['item1', 'item2'] });
    expect(parseAuditArgs(['item1', '--markdown'])).toEqual({ json: false, markdown: true, itemIds: ['item1'] });
    expect(() => parseAuditArgs(['--json', '--markdown', 'item1'])).toThrow('Cannot specify both --json and --markdown');
    expect(() => parseAuditArgs(['--unknown', 'item1'])).toThrow('Unknown option: --unknown');
    expect(() => parseAuditArgs(['--json'])).toThrow('No legacy item IDs provided');
  });

  it('generates field classifications', () => {
    const { classifications, warnings } = generateFieldClassifications({
      bluetoothTags: [],
      tagType: 'QR',
      name: 'Test',
      unknownField: '123'
    });

    expect(classifications).toEqual(expect.arrayContaining([
      { field: 'bluetoothTags', status: 'preserved-as-raw-snapshot' },
      { field: 'tagType', status: 'preserved-as-legacy-reference' },
      { field: 'name', status: 'migrated' },
    ]));
    expect(warnings).toContain("Field 'unknownField' could not be safely classified. Expected project vocabulary only.");
  });

  it('shapes audit summary', () => {
    const summary = shapeAuditSummary(
      'leg1',
      'LEG1',
      { bluetoothTags: [1, 2], tagType: 'nfc' },
      { legacy: { legacyItemId: 'leg1' }, ownerId: 'user1', primaryImageUrl: 'url' },
      2,
      1,
      0
    );

    expect(summary.legacyItemId).toBe('leg1');
    expect(summary.expectedNormalizedObjectId).toBe('LEG1');
    expect(summary.legacyItemExists).toBe(true);
    expect(summary.normalizedObjectExists).toBe(true);
    expect(summary.legacyItemIdMatches).toBe(true);
    expect(summary.ownerIdPresent).toBe(true);
    expect(summary.countBluetoothTags).toBe(2);
    expect(summary.tagTypeValue).toBe('nfc');
  });
});
