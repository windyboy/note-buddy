import { execSync } from "child_process";

const currentVersion = JSON.parse(require("fs").readFileSync("manifest.json", "utf8")).version;
const [major, minor, patch] = currentVersion.split(".").map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

const manifest = JSON.parse(require("fs").readFileSync("manifest.json", "utf8"));
manifest.version = newVersion;
require("fs").writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

try {
	const versions = JSON.parse(require("fs").readFileSync("versions.json", "utf8"));
	versions[newVersion] = new Date().toISOString();
	require("fs").writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
} catch (e) {
	require("fs").writeFileSync("versions.json", JSON.stringify({ [newVersion]: new Date().toISOString() }, null, "\t"));
}

console.log(`Version bumped to ${newVersion}`);
