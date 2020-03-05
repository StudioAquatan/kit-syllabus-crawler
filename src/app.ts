import { fetchSubject } from './crawler/details';

(async () => {
  console.log(await fetchSubject(10014202));
  process.stdin.read();
})();
