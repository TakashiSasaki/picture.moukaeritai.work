import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import fs from 'fs';
import {
  parseAuditArgs,
  shapeAuditSummary,
  formatJsonOutput,
  formatMarkdownOutput
} from './audit-helpers.mjs';

const require = createRequire(import.meta.url);
const appletConfig = JSON.parse(fs.readFileSync('../firebase-applet-config.json', 'utf8'));

// Initialize Firebase Admin (Assumes GOOGLE_APPLICATION_CREDENTIALS is set)
const app = getApps().length ? getApps()[0] : initializeApp();

const db = getFirestore(app, appletConfig.firestoreDatabaseId);

// Safety overrides to strictly prevent accidental writes
db.collection = new Proxy(db.collection, {
  apply: function (target, thisArg, argumentsList) {
    const col = Reflect.apply(target, thisArg, argumentsList);
    col.add = () => { throw new Error('Write operations are strictly prohibited in this read-only script.'); };
    return col;
  }
});

const DocumentReference = require('@google-cloud/firestore').DocumentReference;
DocumentReference.prototype.set = () => { throw new Error('Write operations are strictly prohibited in this read-only script.'); };
DocumentReference.prototype.update = () => { throw new Error('Write operations are strictly prohibited in this read-only script.'); };
DocumentReference.prototype.delete = () => { throw new Error('Write operations are strictly prohibited in this read-only script.'); };
DocumentReference.prototype.create = () => { throw new Error('Write operations are strictly prohibited in this read-only script.'); };

const WriteBatch = require('@google-cloud/firestore').WriteBatch;
WriteBatch.prototype.commit = () => { throw new Error('Write operations are strictly prohibited in this read-only script.'); };


/**
 * @param {string} legacyItemId
 */
async function getLegacyItemData(legacyItemId) {
  const itemRef = db.collection('items').doc(legacyItemId);
  const itemDoc = await itemRef.get();
  return itemDoc.exists ? itemDoc.data() : null;
}

async function getNormalizedObjectData(objectId) {
  const objectDoc = await db.collection('objects').doc(objectId).get();
  return objectDoc.exists ? objectDoc.data() : null;
}

async function getCollectionSize(collectionName, objectId) {
  const snapshot = await db.collection(collectionName)
    .where('objectId', '==', objectId)
    .get();
  return snapshot.size;
}

async function auditLegacyItem(legacyItemId) {
  const objectId = legacyItemId.toUpperCase();

  const legacyData = await getLegacyItemData(legacyItemId);
  const objData = await getNormalizedObjectData(objectId);

  const bindingsSize = await getCollectionSize('objectIdentifierBindings', objectId);
  const imagesSize = await getCollectionSize('objectImages', objectId);
  const eventsSize = await getCollectionSize('objectEvents', objectId);

  return shapeAuditSummary(
    legacyItemId,
    objectId,
    legacyData,
    objData,
    bindingsSize,
    imagesSize,
    eventsSize
  );
}

function printHumanReadable(summary) {
  console.log(`\n======================================================`);
  console.log(`Auditing legacy item: ${summary.legacyItemId}`);
  console.log(`======================================================\n`);

  if (!summary.legacyItemExists) {
    console.error(`❌ Legacy item ${summary.legacyItemId} not found.`);
  } else {
    console.log(`✅ Found legacy item document.`);
  }

  console.log(`Expected normalized Object ID: ${summary.expectedNormalizedObjectId}`);
  if (!summary.normalizedObjectExists) {
    console.warn(`⚠️ Normalized object ${summary.expectedNormalizedObjectId} not found.`);
  } else {
    console.log(`✅ Normalized object found.`);
    if (summary.legacyItemIdMatches) {
      console.log(`  - Legacy reference preserved: ${summary.legacyItemId}`);
    } else {
      console.warn(`  - ⚠️ Legacy reference missing or mismatched!`);
    }

    if (summary.primaryImageUrlPresent) console.log(`  - primaryImageUrl populated.`);
    if (summary.primaryImageIdPresent) console.log(`  - primaryImageId populated.`);

    if (summary.ownerIdPresent) {
       console.log(`  - ownerId populated.`);
    } else {
       console.warn(`  - ⚠️ ownerId missing!`);
    }
  }

  console.log(`\nFound ${summary.countObjectIdentifierBindings} binding(s) for object.`);
  console.log(`Found ${summary.countObjectImages} image(s) for object.`);
  console.log(`Found ${summary.countObjectEvents} event(s) for object.`);

  console.log(`\n--- Legacy Specific Fields ---`);
  if (summary.bluetoothTagsExists) {
     console.log(`🔹 bluetoothTags field exists in legacy item (Count: ${summary.countBluetoothTags}). [Intentionally keeping raw values hidden]`);
  } else {
     console.log(`🔹 No bluetoothTags field in legacy item.`);
  }

  if (summary.tagTypeExists) {
    console.log(`🔹 tagType: ${summary.tagTypeValue}`);
  }

  if (summary.warnings.length > 0) {
    console.log(`\n--- ⚠️ Warnings ---`);
    for (const w of summary.warnings) {
      console.log(` - ${w}`);
    }
  }

  console.log(`\nFinished audit for ${summary.legacyItemId}\n`);
}

async function main() {
  const argv = process.argv.slice(2);
  let parsed;
  try {
    parsed = parseAuditArgs(argv);
  } catch (err) {
    console.error(`Usage Error: ${err.message}`);
    console.error("Usage: cd functions && node scripts/audit-legacy-items.mjs [--json | --markdown] <legacyItemId1> [legacyItemId2] ...");
    console.error("This script is read-only and requires explicit legacy item IDs.");
    process.exit(1);
  }

  const summaries = [];
  for (const legacyItemId of parsed.itemIds) {
    const summary = await auditLegacyItem(legacyItemId);
    summaries.push(summary);
  }

  if (parsed.json) {
    console.log(formatJsonOutput(summaries));
  } else if (parsed.markdown) {
    console.log(formatMarkdownOutput(summaries));
  } else {
    for (const summary of summaries) {
      printHumanReadable(summary);
    }
  }
}

main().catch((e) => {
  console.error("Audit failed:", e);
  process.exit(1);
});
