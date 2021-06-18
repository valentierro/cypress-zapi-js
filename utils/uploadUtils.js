const recursiveReadSync = require("recursive-readdir-sync");
const Client = require("zapi_nodejs");
const fetch = require("node-fetch");
const FormData = require("form-data");

const formData = new FormData();
const fs = require("fs");
// Function to generate Jwt Client
function generateClient(baseUrl, accessKey, secretKey, accountId) {
  // create client
  const JwtClient = new Client(baseUrl, accessKey, secretKey, accountId);
  return JwtClient;
}

function getFiles(path, testName) {
  let files = [""];
  files.shift();
  let filteredFiles;
  try {
    files = recursiveReadSync(path);
    filteredFiles = files.filter(function(e) { return e.includes(testName) })
  } catch (err) {
    if (err.errno === 34) {
      console.log("Path does not exist");
    } else {
      throw err;
    }
  }
  return filteredFiles;
}
module.exports.evidencesUpload = async function (
  accessKey,
  secretKey,
  accountId,
  baseUrl,
  path,
  issueId,
  versionId,
  cycleId,
  executionId,
  projectId,
  testName
) {
  const files = getFiles(path, testName);
  files.forEach((file) => {
    formData.append("file", fs.createReadStream(file));
  });

  const apiUrlAttach = `${baseUrl}/public/rest/api/1.0/attachment?comment=EVIDENCES&cycleId=${cycleId}&entityId=${executionId}&entityName=execution&issueId=${issueId}&projectId=${projectId}&versionId=${versionId}`;
  const tokenAttach = generateClient(
    baseUrl,
    accessKey,
    secretKey,
    accountId
  ).generateJWT("POST", apiUrlAttach, 3600);

  // perform update
  fetch(apiUrlAttach, {
    method: "POST",
    headers: {
      Authorization: `JWT ${tokenAttach}`,
      zapiAccessKey: accessKey,
    },
    body: formData,
  });
};
require("make-runnable");
