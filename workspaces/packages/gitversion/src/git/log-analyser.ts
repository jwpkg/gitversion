import crossSpawn from 'cross-spawn-extra';

const delim1 = 'E2B4D2F3-B7AF-4377-BF0F-D81F4E0723F3';
const delim2 = '25B7DA41-228B-4679-B2A2-86E328D3C3DE';

const endRegex = new RegExp(`${delim2}\\r?\\n?$`);
const formatFlag = `--format=format:%s${delim1}%cI${delim1}%H${delim1}%b${delim2}`;

function parseEntry(entry: any) {
  const [subject, date, hash, body] = entry.split(delim1);

  return {
    subject: subject.trim(),
    date: new Date(date),
    hash: hash.trim(),
    body: body.trim(),
  };
}

export async function logs() {
  const args = ['log', formatFlag];

  // if (options.merges !== true) {
  //   args.push('--no-merges');
  // }

  // args.push(options.range || 'HEAD');

  // if (options.path) {
  //   args.push('--');

  //   if (Array.isArray(options.path)) {
  //     args.push(...options.path);
  //   } else {
  //     args.push(options.path);
  //   }
  // }

  const output = await crossSpawn('git', args);

  return output.stdout.toString().replace(endRegex, '').split(delim2).map(parseEntry);
}
