# 📦 MicroPython Package Installer for Arduino

MicroPython Package Installer for Arduino is a cross-platform tool that streamlines the process of downloading and installing MicroPython packages on compatible Arduino boards. It is compatible with macOS, Linux, and Windows and is built using the Electron framework.

## ✨ Features
- Browse through Arduino's official [MicroPython package index](https://github.com/arduino/package-index-py)
- Find packages based on their name, their description or other meta data
- Install MicroPython packages including their dependencies
- Cross compile python files for reduced storage requirements and faster execution
- Detect if existing package would be overwritten

## 💻 System Requirements
There are no special system requirements for this tool beyond the prerequisites for running Electron applications.

## 👀 Usage
Connect your Arduino board to your computer.
Launch the application.
Follow the on-screen prompts to download and install the MicroPython firmware.

## ✅ Supported Boards
- Arduino Portenta H7
- Arduino Portenta C33
- Arduino Nicla Vision
- Arduino Giga
- Arduino Nano RP2040
- Arduino Nano ESP32
- Arduino Nano 33 BLE

**Note:** This tool may work for 3rd party boards too. This is however not officially supported.

## ⚙️ Installation

You can download the binary for your operating system from the [release page](https://github.com/arduino/lab-micropython-package-installer/releases).

## 🚑 Troubleshooting

- If you get an error message such as "Error: Resource busy, cannot open /dev/cu.usbmodem1101" please double check if you have a tool on your computer running that occupies the serial port. It's also possible that your board is running a MicroPython script that occupies the serial port (check boot.py and main.py).

## 🐛 Reporting Issues
If you encounter any issue, please open a bug report [here](https://github.com/arduino/lab-micropython-package-installer/issues). Please also add all generated log output to your issue. To get that, you need to launch the tool from the command line:
- macOS: `"/Applications/MicroPython-Package-Installer.app/Contents/MacOS/micropython-installer"`
- Windows: `micropython-package-installer.exe | echo`
- Linux: `micropython-package-installer`

You may need to adjust the path depending on where the tool is installed on your system.

## 🧑‍💻 Developer Installation

```bash
# Clone this repository
git clone https://github.com/arduino/lab-micropython-package-installer.git

# Go into the repository
cd lab-micropython-package-installer

# Install dependencies
npm install

# Run the app
npm run start
```

## 📦 Packaging

The packaging is done via Electron Forge. The configuration can be found in [forge.config.js](./forge.config.js). To package the app, run:

```bash
npm run make # Creates a ready-to-run application
# or
npm run package # Creates a distributable file bundle
```

## 📣 Publishing

The CI takes care of making new releases. All that needs to be done is to bump the version with `npm version patch`, `npm version minor` or `npm version major` and push the tags with `git push --follow-tags`. 
When the CI is done the release will be in draft state so you can add release notes and publish it.

To do a development release, you can run e.g. `npm version preminor --preid=beta` to create a new minor version of the tool that contains the given suffix (e.g. v1.1.9-beta). For each successor development version you can run `npm version prerelease` which bumps the "beta" version to the next number (e.g. v1.1.0-beta.2).

To manually publish a new version (if you really need to), run:

```bash
npm run publish
```

## 💪 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 🤙 Contact
For questions, comments, or feedback about this tool, please create an issue on this repository.
