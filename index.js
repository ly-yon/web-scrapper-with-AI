import main from "./main-multi-language.js";
const args = process.argv.slice(2);
const url = args[0];
if (url)
  main(url).then((res) => {
    // console.log(res);
    console.log(JSON.stringify(res));
  });
