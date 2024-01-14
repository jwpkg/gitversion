import { logs } from './git/log-analyser';

async function main() {
  console.log(await logs());
}

main().then(() => {
  console.log('done');
});
