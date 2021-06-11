<img src="https://www.cypress.io/static/33498b5f95008093f5f94467c61d20ab/59c46/cypress-logo.webp" width="10%">      <img src="https://static1.smartbear.co/smartbearbrand/media/images/logos/product-only/zsq_product-only-clr.svg">  <img src="https://gtswiki.gt-beginners.net/decal/png/20/89/27/5125114039554278920_1.png" width="10%">   <img src="https://www.kelvinsantiago.com.br/wp-content/uploads/2019/05/node-1.png" width="10%">

<img alt="npm" src="https://img.shields.io/badge/Zephyr Squad-blue"> <img alt="npm" src="https://img.shields.io/badge/Languages-Javascript-yellow"> <img alt="npm" src="https://img.shields.io/badge/-NodeJs-green">
<img alt="npm" src="https://img.shields.io/badge/Cypress-Ready!-green">

# cypress-base-js
Lib for connection between Cypress and Zephyr, enabling execution update via API.

## Pre-requisites:

To work properly will be necessary to create/update some files: the files `cypress.json`, `cypress.env.json` and `cypress/plugins/index.js`

- Update the file cypress/plugins/index.js adding:
```
  const path = require("path");
  
  on("task", {
    getPackagePath() {
      return path.dirname(require.resolve("../../", "package.json"));
    },
  });

```

- Add the environment variables bellow on your `cypress.json` or `cypress.env.json`:
```
  "cypress-zapi": {
  "updateJira": true, // false = after test execution will not update the Jira | true = after test execution will update the Jira
  "uploadAttachOnFailure":true, // false = If test fail will not upload evidence (cypress screenshot) | true = If test fail will upload evidence (cypress screenshot)
  "baseUrl": "https://prod-api.zephyr4jiracloud.com/connect", // Zephyr Api base url
  "accessKey": "NzY0NWQyNWMtxxxxxxxxxxxxxxxxxxxxxxxxxxxmMzQyNTYyMzIzNjA3MDAzODU0MGYyMyBjeXByZXNzMQ", // User access key. See: https://cucumberforjira.atlassian.net/wiki/spaces/C4JD/pages/13139969/How+to+automatically+push+Cucumber+test+results+into+a+Zephyr+test+cycle
  "secretKey": "PaI_EcWna9-xxxxxxxxxxxxxxxx-Z_wz1aZS0Q", // User secret key. See: https://cucumberforjira.atlassian.net/wiki/spaces/C4JD/pages/13139969/How+to+automatically+push+Cucumber+test+results+into+a+Zephyr+test+cycle
  "accountId": "5f3xxxxxxxxxxxxxxxxxxxxxx", // Account Id. See: https://community.atlassian.com/t5/Jira-questions/how-to-find-accountid/qaq-p/1111436
  "projectId": "10000", // Jira project Id. See: https://confluence.atlassian.com/jirakb/how-to-get-project-id-from-the-jira-user-interface-827341414.html
  "versionId": "10007", // Jira project version. See: https://support.atlassian.com/jira-core-cloud/docs/view-and-manage-a-projects-versions/
  "assignee": "erickvalentin", // Jira username
  "cycles": {
    "copyTestsFromOtherCycle": true, // false = Copy tests from another cycle | true = Don't copy tests from another cycle
    "currentCycle": "Cycle6 - Sprint 3", // Cycle of the tests that will be executed
    "copyFromCycle": "Cycle - Sprint 3", // If 'copyTestsFromOtherCycle' = true, the tests of this cycle will be copied to the currentCycle
    "copyFromVersionId": "10001" // If 'copyTestsFromOtherCycle' = true, the tests of this version will be copied to the currentCycle
  }
}
```

- On cypress/support create a hook file `zephyr-base.js`
```
const ZAPI = require("cypress-zapi-js");

beforeEach(() => {});

afterEach(() => {
  Cypress.on("uncaught:exception", (err) => {
    throw err;
  });
  if (Cypress.env("cypress-zapi").updateJira) {
    cy.log("Update Jira Enabled");
    const testResult = Cypress.mocha.getRunner().suite.ctx.currentTest.state;
    let intTestResult = "0";
    const titleString = Cypress.mocha.getRunner().suite.ctx.currentTest.title;
    const issueKey = titleString.substr(0, titleString.indexOf(",")).trim();
    switch (testResult) {
      case "passed":
        intTestResult = "1";
        break;
      case "failed":
        intTestResult = "2";
        break;
      default:
        intTestResult = "-1";
    }
    try {
      ZAPI.createExecution(
        Cypress.env("cypress-zapi").baseUrl,
        Cypress.env("cypress-zapi").accessKey,
        Cypress.env("cypress-zapi").secretKey,
        Cypress.env("cypress-zapi").accountId,
        Cypress.env("cypress-zapi").projectId,
        Cypress.env("cypress-zapi").versionId,
        issueKey,
        Cypress.env("cypress-zapi").cycles.currentCycle,
        intTestResult,
        Cypress.env("cypress-zapi").uploadAttachOnFailure,
        Cypress.env("cypress-zapi").cycles.copyTestsFromOtherCycle,
        Cypress.env("cypress-zapi").cycles.copyFromCycle,
        Cypress.env("cypress-zapi").cycles.copyFromVersionId
      );
    } catch (error) {
      console.error(`Error to update the status on Jira: ${error}`);
    }
  } else {
    cy.log("Update Jira Disabled");
  }
});

before(() => {});

after(() => {});

```


## How to implement the tests:

- With cucumber and cypress:

```
// Google.feature

Feature: Google Main Page

  I want to open a search engine
  
  Scenario: TES-39, Validates fields new // The issue code should be added to the test title (TES-39)
    Given I open Google page
 
```


## Authors

- Erick Henrique Valentin dos Santos
Email: ovalen507@gmail.com




[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [Docker article]: <https://linuxhint.com/install_configure_docker_ubuntu/>
