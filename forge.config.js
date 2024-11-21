const os = require('os');
const path = require('path');

const platform = os.platform();
const architecture = os.arch();

const applicationNames = {
  'darwin': 'MicroPython-Package-Installer',
  'win32': 'MicroPython-Package-Installer',
  'linux': 'micropython-package-installer'
};

const applicationName = applicationNames[platform];
let filesToExclude = [];

switch (platform) {
  case 'win32':
    filesToExclude = ["(\/bin\/linux$)",
                      "(\/bin\/darwin$)",
                      "(\/@serialport\/bindings-cpp\/prebuilds\/android.*)",
                      "(\/@serialport\/bindings-cpp\/prebuilds\/darwin.*)",
                      "(\/@serialport\/bindings-cpp\/prebuilds\/linux.*)"
                    ];
    break;
  case 'darwin':
    filesToExclude = ["\/bin\/linux$", 
                      "\/bin\/win32$",
                      "\/@serialport\/bindings-cpp\/prebuilds\/android.*",
                      "\/@serialport\/bindings-cpp\/prebuilds\/linux.*",
                      "\/@serialport\/bindings-cpp\/prebuilds\/win32.*",
                    ];
    break;
  default:
    filesToExclude = ["(\/bin\/darwin$)", 
                      "(\/bin\/win32$)",
                      "(\/@serialport\/bindings-cpp\/prebuilds\/darwin.*)",
                      "(\/@serialport\/bindings-cpp\/prebuilds\/android.*)",
                      "(\/@serialport\/bindings-cpp\/prebuilds\/win32.*)",
                    ];
    break;
}

const distributableRenamingRules = {
  "darwin": { from: 'darwin', to: 'macOS' },
  "win32": { from: 'Setup', to: 'Windows-Setup' },
  "linux": { from: 'amd64', to: 'Linux' }
};

// Check options at https://electron.github.io/electron-packager/main/interfaces/electronpackager.options.html
module.exports = {
  hooks: {
    postMake: async (forgeConfig, results) => {
      const fs = require('fs');

      for(let result of results) {
        result.artifacts.forEach((artifact, index) => {  
          const fileName = path.basename(artifact);          
          const renameRule = distributableRenamingRules[result.platform];
          
          if(!fileName.includes(renameRule.from)) {
            return;
          }
          const targetName = fileName.replace(renameRule.from, renameRule.to);
          console.log(`Renaming ${fileName} to ${targetName}`);
          const targetPath = path.join(path.dirname(artifact), targetName);

          try {
            fs.renameSync(artifact, targetPath);
            result.artifacts[index] = targetPath;
          } catch (err) {
            console.error(err);
          }
        });
      }
      return results;
    }
  },
  packagerConfig: {
    icon: './assets/app-icon',
    name: applicationName, // Name cannot contain spaces because gyp doesn't support them
    arch: 'all',
    ignore: filesToExclude,
    prune: true,
    derefSymlinks: true,
    protocols: [ {
      name: 'micropython-package-installer',
      schemes: ['micropython-package-installer']
    }],
    // osxUniversal: {
    //   outAppPath: './out/' + applicationName + '-darwin-universal.app',
    // },
    osxSign: {
      app: './out/' + applicationName + '-darwin-' + architecture + '/' + applicationName + '.app',
      optionsForFile: (filePath) => {
        return {
          entitlements: './config/entitlements.plist'
        }
      },
      keychain: process.env.KEYCHAIN_PATH
    },
    osxNotarize: process.env.APPLE_API_KEY_PATH ? {
      tool: 'notarytool',
      appPath: './out/' + applicationName + '-darwin-' + architecture + '/' + applicationName + '.app',
      appleApiKey: process.env.APPLE_API_KEY_PATH,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER,
    } : undefined,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        loadingGif: './assets/installer.gif',
        // See: https://js.electronforge.io/interfaces/_electron_forge_maker_squirrel.InternalOptions.WindowsSignOptions.html
        // See: https://www.npmjs.com/package/@electron/windows-sign
        signWithParams : process.env.WINDOWS_CERTIFICATE_FILE ? [
          '/d', '\"MicroPython Package Installer\"',
          '/f', `\"${process.env.WINDOWS_CERTIFICATE_FILE}\"`,
          '/csp', '\"eToken Base Cryptographic Provider\"',
          '/kc', `\"[{{${process.env.WINDOWS_CERTIFICATE_PASSWORD}}}]=${process.env.WINDOWS_CERTIFICATE_CONTAINER}\"`,
          '/fd', '\"sha256\"',
          '/tr', '\"http://timestamp.digicert.com\"',
          '/td', '\"SHA256\"',
          // '/v' // Verbose output
        ].join(' ') : undefined
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
    },
  ],
  publishers: [
    {
      "name": "@electron-forge/publisher-github",
      "config": {
        "repository": {
          "owner": "arduino",
          "name": "lab-micropython-package-installer"
        }
      }
    }
  ]
};
