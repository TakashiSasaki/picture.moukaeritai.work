import fs from 'fs';
import path from 'path';

function main() {
  const args = process.argv.slice(2);
  let evidencePath = 'docs/migrations/scanner-observation-dual-write-runtime-contract-evidence.json';
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--evidence' && args[i + 1]) {
      evidencePath = args[i + 1];
      i++;
    } else if (args[i] === '--json') {
      jsonOutput = true;
    }
  }

  const resolvedEvidencePath = path.resolve(process.cwd(), evidencePath);

  if (!fs.existsSync(resolvedEvidencePath)) {
    console.error(`Error: Evidence file not found at ${resolvedEvidencePath}`);
    process.exit(1);
  }

  let evidenceData;
  try {
    const rawData = fs.readFileSync(resolvedEvidencePath, 'utf8');
    evidenceData = JSON.parse(rawData);
  } catch (err) {
    console.error(`Error parsing evidence JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = [];

  // Enforce the required conditions
  if (evidenceData.featureFlagEnabledInThisStride !== false) errors.push("featureFlagEnabledInThisStride must be false");
  if (evidenceData.runtimeDefaultBehaviorChanged !== false) errors.push("runtimeDefaultBehaviorChanged must be false");
  if (evidenceData.indexesChanged !== false) errors.push("indexesChanged must be false");
  if (evidenceData.migrationExecuted !== false) errors.push("migrationExecuted must be false");
  if (evidenceData.readSwitchingAuthorized !== false) errors.push("readSwitchingAuthorized must be false");
  if (evidenceData.rolloutApproved !== false) errors.push("rolloutApproved must be false");
  if (evidenceData.legacyIdentifierObservationsChanged !== false) errors.push("legacyIdentifierObservationsChanged must be false");

  if (evidenceData.objectEventsAuthoritative !== true) errors.push("objectEventsAuthoritative must be true");
  if (evidenceData.targetObservationsRulesHardened !== true) errors.push("targetObservationsRulesHardened must be true");
  if (evidenceData.builderFlatSchemaAligned !== true) errors.push("builderFlatSchemaAligned must be true");
  if (evidenceData.runtimeShadowWriterFeatureGated !== true) errors.push("runtimeShadowWriterFeatureGated must be true");

  const valid = errors.length === 0;

  const result = {
    success: valid,
    valid,
    status: valid ? "local-evidence-pass" : "local-evidence-fail",
    evidenceType: "scanner-observation-dual-write-runtime-contract-evidence",
    errors,
    safetyNotes: [
      "local-evidence-only",
      "no Firebase calls",
      "no Firestore writes",
      "no network calls",
      "no environment credentials",
      "local-evidence-pass is not rollout approval"
    ]
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (!valid) {
      console.error('Validation failed with the following errors:');
      errors.forEach(e => console.error(` - ${e}`));
    } else {
      console.log('Validation passed: local-evidence-pass');
    }
  }

  if (!valid) {
    process.exit(1);
  }
}

main();
