// include library
const Client = require("zapi_nodejs");
const fetch = require("node-fetch");
const path = require("path");
const utils = require("./utils/utils");

let cycleId;
let targetCycleId;
let executionId;
let issueId;

// Function to generate Jwt Client
function generateClient(baseUrl, accessKey, secretKey, accountId) {
  // create client
  const JwtClient = new Client(baseUrl, accessKey, secretKey, accountId);
  return JwtClient;
}

// Function to Upload Files to Jira

// Modules
module.exports = {
  createExecution(
    baseUrl,
    accessKey,
    secretKey,
    accountId,
    projectId,
    versionId,
    issueKey,
    currentCycleName,
    testResult,
    uploadAttachOnFailure,
    copyTestsFromOtherCycle,
    copyFromCycle,
    copyFromVersionId
  ) {
    const setupData = [""];
    setupData.push(baseUrl, accessKey, secretKey, accountId);
    /// //////////////////////// Get Current and Target CycleId ///////////////////////////
    const apiUrlCycle = `${baseUrl}/public/rest/api/1.0/cycles/search?projectId=${projectId}&versionId=${versionId}`;

    const tokenCycle = generateClient(
      baseUrl,
      accessKey,
      secretKey,
      accountId
    ).generateJWT("GET", apiUrlCycle, 3600);

    // Perform get Current and target cycleId
    fetch(apiUrlCycle, {
      method: "GET",
      headers: {
        Authorization: `JWT ${tokenCycle}`,
        zapiAccessKey: accessKey,
        "Content-Type": "text/plain",
      },
    }).then((response) => {
      response.text().then((result) => {
        const arrayCycleNames = utils.getJsonValueArray(result, "[*].name");
        for (let i = 0; i < arrayCycleNames.length; i++) {
          if (copyTestsFromOtherCycle) {
            if (arrayCycleNames[i] === copyFromCycle) {
              targetCycleId = utils.getJsonValueString(
                result,
                `[${i}].cycleIndex`
              );
            }
          }
          if (arrayCycleNames[i] === currentCycleName) {
            cycleId = utils.getJsonValueString(result, `[${i}].cycleIndex`);
            setupData.push(cycleId);

            if (copyTestsFromOtherCycle) {
              /// //////////////////////// Copy all tests from another cycle ///////////////////////////
              const apiCopyFromCycle = `${baseUrl}/public/rest/api/1.0/executions/add/cycle/${cycleId}`;
              // generate token
              const tokenCopyFromCycle = generateClient(
                baseUrl,
                accessKey,
                secretKey,
                accountId
              ).generateJWT("POST", apiCopyFromCycle, 3600);
              const payloadCopyTests = {
                fromCycleId: targetCycleId, 
                method: "3", 
                fromVersionId: parseInt(copyFromVersionId),
                projectId: parseInt(projectId), 
                versionId: versionId, // Set project version Id,
              };
              // perform execution creation
              fetch(apiCopyFromCycle, {
                method: "POST",
                headers: {
                  Authorization: `JWT ${tokenCopyFromCycle}`,
                  zapiAccessKey: accessKey,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payloadCopyTests),
              });
            }

            /// //////////////////////// Get issueId ///////////////////////////

            const apiUrl = `${baseUrl}/public/rest/api/2.0/executions/search/cycle/${cycleId}?projectId=${projectId}&versionId=${versionId}`;
            // generate token
            const tokenIssue = generateClient(
              baseUrl,
              accessKey,
              secretKey,
              accountId
            ).generateJWT("GET", apiUrl, 3600);

            // perform get issueId
            fetch(apiUrl, {
              method: "GET",
              headers: {
                Authorization: `JWT ${tokenIssue}`,
                zapiAccessKey: accessKey,
                "Content-Type": "text/plain",
                "Access-Control-Allow-Origin": "localhost",
              },
            }).then((response) =>
              response.text().then((result) => {
                const arrayIssues = utils.getJsonValueArray(
                  result,
                  "searchResult.searchObjectList[*].issueKey"
                );
                for (let i = 0; i < arrayIssues.length; i++) {
                  if (arrayIssues[i] === issueKey) {
                    issueId = utils.getJsonValueString(
                      result,
                      `searchResult.searchObjectList[${i}].execution.issueId`
                    );
                    setupData.push(issueId);
                    /// //////////////////////// Create new execution ///////////////////////////

                    const apiUrlExecution = `${baseUrl}/public/rest/api/1.0/execution`;
                    // generate token
                    const tokenExecution = generateClient(
                      baseUrl,
                      accessKey,
                      secretKey,
                      accountId
                    ).generateJWT("POST", apiUrlExecution, 3600);
                    const payloadCreate = {
                      status: { id: parseInt(-1) },
                      id: utils.createUUID(), 
                      cycleId: setupData[5], // Set Cycle Id
                      issueId: parseInt(setupData[6]), // Set Issue Id
                      projectId: parseInt(projectId), // Set project Id
                      versionId: versionId, // Set project version Id
                    };
                    // perform execution creation
                    fetch(apiUrlExecution, {
                      method: "POST",
                      headers: {
                        Authorization: `JWT ${tokenExecution}`,
                        zapiAccessKey: accessKey,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(payloadCreate),
                    }).then((response) => {
                      response.text().then((result) => {
                        executionId = utils.getJsonValueString(
                          result,
                          "execution.id"
                        );
                        setupData.push(executionId, projectId, versionId);

                        /// ////////////////////// Update execution status ///////////////////////////
                        const apiUrlUpdate = `${baseUrl}/public/rest/api/1.0/execution/${executionId}`;

                        // generate token
                        const tokenUpdate = generateClient(
                          baseUrl,
                          accessKey,
                          secretKey,
                          accountId
                        ).generateJWT("PUT", apiUrlUpdate, 3600);
                        const payloadUpdate = {
                          status: { id: parseInt(testResult) },
                          cycleId: setupData[5], 
                          issueId: parseInt(setupData[6]), 
                          projectId: parseInt(projectId), 
                          versionId: versionId, 
                          comment: `Executed by Cypress automation in ${utils.getDateNow()}`,
                        };
                        // perform update
                        fetch(apiUrlUpdate, {
                          method: "PUT",
                          headers: {
                            Authorization: `JWT ${tokenUpdate}`,
                            zapiAccessKey: accessKey,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(payloadUpdate),
                        });
                        /// //////////////////// Call upload attachment function ////////////////////////
                        if (testResult === "2") {
                          if (uploadAttachOnFailure) {
                            try {
                              cy.task("getPackagePath").then((packagePath) => {
                                cy.exec(
                                  `node ${packagePath}${path.sep}utils${
                                    path.sep
                                  }uploadUtils.js evidencesUpload ${accessKey} ${secretKey} ${accountId} ${baseUrl} cypress/screenshots ${parseInt(
                                    setupData[6]
                                  )} ${versionId} ${
                                    setupData[5]
                                  } ${executionId} ${parseInt(
                                    projectId
                                  )} ${issueKey}`
                                );
                              });
                            } catch (error) {
                              console.error(
                                `Error to upload the attachments: ${error}`
                              );
                            }
                          }
                        }
                      });
                    });
                  }
                }
              })
            );
          }
        }
      });
    });
  },
};
