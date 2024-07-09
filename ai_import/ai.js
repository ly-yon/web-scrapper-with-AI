// Load Naive Bayes Text Classifier

import Classifier from "wink-naive-bayes-text-classifier";
import fs from "fs";
// Instantiate

const nbc = Classifier();
// 1. Load Your Labeled Data
const labeledData = JSON.parse(
  fs.readFileSync("./ai_import/naive_bayes_model.json", "utf-8")
);
// var prepText = require("wink-naive-bayes-text-classifier/src/prep-text.js");
import prepText from "wink-naive-bayes-text-classifier/src/prep-text.js";
nbc.definePrepTasks([prepText]);
nbc.defineConfig({ considerOnlyPresence: false, smoothingFactor: 0.5 });
// labeledData.forEach((item) => {
//   //   console.log(item);
//   nbc.learn(item.cleanedText, item.label);
// });
nbc.importJSON(labeledData);
// const modelData = JSON.stringify(nbc.exportJSON());
// fs.writeFileSync("naive_bayes_model.json", modelData);
nbc.consolidate();
// 6. Load and Use Your Model for Prediction (example)
function run(data, label) {
  const newText = data;
  const odd = nbc.computeOdds(newText)[0];
  if (label !== odd[0]) return false;
  if (Math.abs(odd[1]) < 50) return false;
  return true;
}

export default run;
