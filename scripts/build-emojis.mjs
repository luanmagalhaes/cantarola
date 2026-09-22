import { writeFileSync } from "node:fs";
import compact from "emojibase-data/pt/compact.json" with { type: "json" };
import full from "emojibase-data/pt/data.json" with { type: "json" };

const newestVersion = 15.1;
const componentGroup = 2;

const versions = new Map();

function collect(list) {
  for (const entry of list) {
    versions.set(entry.hexcode, entry.version);

    if (entry.skins) {
      collect(entry.skins);
    }
  }
}

collect(full);

const supported = (entry) => (versions.get(entry.hexcode) ?? 99) <= newestVersion;

const toneMarks = { "1F3FB": "1", "1F3FC": "2", "1F3FD": "3", "1F3FE": "4", "1F3FF": "5" };

function toneOf(hexcode) {
  const marks = hexcode.split("-").filter((part) => toneMarks[part]);

  return marks.length === 1 ? toneMarks[marks[0]] : null;
}

const emojis = compact
  .filter((entry) => entry.group !== undefined && entry.group !== componentGroup && supported(entry))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map((entry) => {
    const tones = (entry.skins ?? [])
      .filter(supported)
      .map((skin) => [toneOf(skin.hexcode), skin.unicode])
      .filter(([tone]) => tone !== null);

    return {
      g: entry.group,
      u: entry.unicode,
      l: entry.label,
      t: (entry.tags ?? []).join(" "),
      ...(tones.length > 0 ? { s: Object.fromEntries(tones) } : {}),
    };
  });

writeFileSync("public/emojis.json", JSON.stringify(emojis));

const groups = {};
emojis.forEach((entry) => {
  groups[entry.g] = (groups[entry.g] ?? 0) + 1;
});

console.log(`${emojis.length} emojis, grupos ${JSON.stringify(groups)}`);
