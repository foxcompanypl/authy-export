import CDP from "chrome-remote-interface";
import fs from "fs";

const config = {
  port: parseInt(process.env.DEBUG_PORT || "9222"),
  exportFile: "/root/export.json",
  fields: {
    countryCode: process.env.COUNTRY_CODE,
    phoneNumber: process.env.PHONE_NUMBER,
    backupPassword: process.env.BACKUP_PASSWORD,
  },
};

async function sleep(time = 1000) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

async function waitForApp(client: CDP.Client, timeout = 10_000) {
  const start = Date.now();
  while (true) {
    const { result } = await client.Runtime.evaluate({
      expression: `window.appManager && window.appManager.getModel().length > 0`,
    });
    if (result.type === "boolean" && result.value === true) {
      break;
    }
    if (Date.now() - start > timeout) {
      throw new Error("Timeout");
    }
    await sleep(1000);
  }
}

async function handleLoginScreen(client: CDP.Client) {
  await client.Runtime.evaluate({
    expression: `
          function sleep(time = 1000) {
              return new Promise((resolve, reject) => {
                  setTimeout(() => {
                      resolve();
                  }, time);
              });
          }
          async function loginForm() {  
              const fillText = (selector, value) => {
                  document.querySelector(selector).select();
                  document.execCommand('insertText', false, value);
              };
              console.debug('Fill login form');
              Array.from(document.querySelectorAll('li[data-paste-element="COMBOBOX_LIST_ITEM"]')).find(e => e.innerText.indexOf("${config.fields.countryCode}") > -1).click();
              await sleep(500);
              fillText('input[name="phone_number"]',"${config.fields.phoneNumber}");
              await sleep(500);
              document.querySelector('button[type="button"]').click();
              console.debug('Waiting for alert dialog');
              await sleep(1000);
              document.querySelectorAll('div[role="alertdialog"] button[type="button"]')[1].click();
              console.debug('Waiting for verify form');
              await sleep(1000);
              Array.from(document.querySelectorAll('button[type="button"]')).find(e => e.innerText.indexOf("Use existing device") > -1).click();
          }
          loginForm();
          `,
  });
}

async function handleEncryption(client: CDP.Client) {
  const { result: isDecrypted } = await client.Runtime.evaluate({
    expression: `appManager.getModel().every(i => i.decryptedSeed || i.secretSeed)`,
  });
  if (isDecrypted.type === "boolean" && isDecrypted.value === true) {
    return;
  }
  const { result } = await client.Runtime.evaluate({
    expression: `
        new Promise((resolve,reject) => {
            appManager.decryptApps("${config.fields.backupPassword}", () => resolve(true), () => resolve(false));
        });
      `,
    awaitPromise: true,
  });
  if (result.type === "boolean" && result.value === false) {
    throw new Error("Can't decrypt apps. Check your password.");
  }
}

async function handleExport(client: CDP.Client) {
  // Based on https://github.com/authier-pm/authy-desktop-export
  const exportRes = await client.Runtime.evaluate({
    expression: `
            const hex_to_b32 = (hex) => {
                let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
                let bytes = [];
                for (let i = 0; i < hex.length; i += 2) {
                    bytes.push(parseInt(hex.substr(i, 2), 16));
                }
                let bits = 0;
                let value = 0;
                let output = "";
                for (let i = 0; i < bytes.length; i++) {
                    value = (value << 8) | bytes[i];
                    bits += 8;
                    while (bits >= 5) {
                        output += alphabet[(value >>> (bits - 5)) & 31];
                        bits -= 5;
                    }
                }
                if (bits > 0) {
                    output += alphabet[(value << (5 - bits)) & 31];
                }
                return output;
            };
            JSON.stringify(appManager.getModel().map(function(i) {
                const secret = (i.markedForDeletion === false ? i.decryptedSeed : hex_to_b32(i.secretSeed));
                return {
                    ...i, 
                    secret
                };
            }))`,
  });
  fs.writeFileSync(config.exportFile, exportRes.result.value);
}

async function run() {
  const client = await CDP({
    host: "127.0.0.1",
    port: config.port,
  });
  console.log("Connected to authy");
  console.log("Handle login screen");
  await handleLoginScreen(client);
  console.log(
    "Waiting for login confirmation. If you don't see the prompt, please check your phone."
  );
  console.log("Waiting for app to load");
  await waitForApp(client, 60_000);
  console.log("Check if account is encrypted");
  await handleEncryption(client);
  console.log("Export accounts");
  await handleExport(client);
  await client.close();
}

try {
  run();
} catch (e) {
  console.error(e);
}
