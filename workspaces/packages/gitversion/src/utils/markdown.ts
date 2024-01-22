export type Marker = (...message: string[]) => string;
export const h1: Marker = (...m) => `# ${m.join(' ')}\n`;
export const h2: Marker = (...m) => `## ${m.join(' ')}\n`;
export const h3: Marker = (...m) => `### ${m.join(' ')}\n`;
export const h4: Marker = (...m) => `#### ${m.join(' ')}\n`;
export const h5: Marker = (...m) => `##### ${m.join(' ')}\n`;
export const li: Marker = (...m) => `* ${m.join(' ')}\n`;
export const b: Marker = (...m) => `**${m.join(' ')}**`;
export const i: Marker = (...m) => `*${m.join(' ')}*`;

export function link(title: string, url: string) {
  return `[${title}](${url})`;
}
