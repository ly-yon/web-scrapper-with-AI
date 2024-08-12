import main from "./main-multi-language.js";
const args = process.argv.slice(2); // Remove Node.js and script name
const url = args[0]; // Get the URL (expected as the first argument)
async function run(url) {
  if (url) {
    const result = await main(url);
    console.log(JSON.stringify(result));
  } else console.log(JSON.stringify({ url: "Not Valid" }));
}
run(url);
