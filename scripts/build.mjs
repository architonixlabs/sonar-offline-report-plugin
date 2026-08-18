import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pom = await readFile(resolve(root, "pom.xml"), "utf8");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const pluginVersion = pom.match(/<artifactId>sonar-offline-report-plugin<\/artifactId>\s*<version>([^<]+)<\/version>/)?.[1];
if (!pluginVersion) throw new Error("Could not determine the plugin version from pom.xml.");
if (packageJson.version !== pluginVersion) throw new Error(`package.json ${packageJson.version} does not match pom.xml ${pluginVersion}.`);
const inputs = ["core.js", "xlsx.js", "docx.js", "api.js", "html-report.js", "app.js", "index.js"];
const banner = `/* SonarQube Offline Report Plugin ${pluginVersion} - generated; edit src/main/js and run npm run build. */\n`;
const buildMetadata = `window.OfflineReportBuild = Object.freeze({ pluginVersion: ${JSON.stringify(pluginVersion)} });\n`;
const parts = await Promise.all(inputs.map((name) => readFile(resolve(root, "src/main/js", name), "utf8")));
const output = `${banner}${buildMetadata}${parts.join("\n\n")}\n`;
const outputPath = resolve(root, "src/main/resources/static/report_page.js");

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) {
    console.error("Static report_page.js is stale; run npm run build.");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, output, "utf8");
  console.log(`Built ${outputPath}`);
}
