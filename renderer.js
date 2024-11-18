let cachedPackages = []; // Global variable to cache packages
let selectedDeviceItem = null;  // Variable to keep track of the selected board
const deviceSelectionList = document.querySelector(".item-selection-list");
const reloadDeviceListLink = document.getElementById("reload-link");

async function fetchPackages(){
    const packageList = document.getElementById('package-list');

    // Show loading spinner
    packageList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const packages = await window.api.getPackages();
        cachedPackages = packages;
        renderPackageList(cachedPackages, ''); // Render the fetched packages
        performSearch(); // Initial render with all packages                
    } catch (error) {
        console.error('Error fetching packages:', error);
        document.getElementById('package-list').innerHTML = '<p>Error loading packages.</p>';
    }
}

async function reloadDeviceList() {
    setInstallButtonsEnabled(false); // Disable until a board is selected
    const boards = await window.api.getBoards();
    displayDevices(boards, deviceSelectionList);
}

// Fetch package list once on app load and cache it
document.addEventListener('DOMContentLoaded', async () => {
    await fetchPackages();
    
    deviceSelectionList.addEventListener("device-selected", (event) => {
        selectedDeviceItem = event.target;
        console.log("Selected device item:", selectedDeviceItem);
        // Enable the install buttons if a board is selected
        setInstallButtonsEnabled(true);
    });

    reloadDeviceListLink.addEventListener('click', async () => {
        await reloadDeviceList();
    });
    await reloadDeviceList(); // Initial load of the device list
});

function selectDevice(deviceItem) {
    const container = deviceItem.parentElement;
    const previousSelectedElement = container.querySelector(".selected");

    if (previousSelectedElement !== null) {
        previousSelectedElement.classList.remove("selected");
    }

    deviceItem.classList.add("selected");
    deviceItem.dispatchEvent(new Event("device-selected", { bubbles: true }));
}

function createDeviceSelectorItem(device) {
    const fullDeviceName = device.manufacturer + " " + device.name;
    const deviceItem = document.createElement("button");
    deviceItem.classList.add("selection-item");

    // Populate the device item with data attributes so that we can easily access them later
    // when the user selects a device and we need to flash the firmware
    deviceItem.setAttribute("data-name", device.name);
    deviceItem.setAttribute("data-manufacturer", device.manufacturer);
    deviceItem.setAttribute("data-vid", device.vendorID);
    deviceItem.setAttribute("data-pid", device.productID);
    deviceItem.setAttribute("data-port", device.serialPort);    
    deviceItem.addEventListener("click", () => {
        selectDevice(deviceItem);
    });

    const deviceImage = document.createElement("img");
    deviceImage.setAttribute("src", "./assets/boards/" + fullDeviceName + ".svg");
    deviceItem.appendChild(deviceImage);

    const deviceLabel = document.createElement("span");
    deviceLabel.classList.add("selection-item-label");
    deviceLabel.textContent = device.name;
    deviceItem.appendChild(deviceLabel);

    return deviceItem;
}

function displayDevices(deviceList, container) {

    selectedDeviceItem = null;

    // Sort the device list by manufacturer name and device name
    deviceList.sort((deviceA, deviceB) => {
        const deviceAName = deviceA.manufacturer + deviceA.name;
        const deviceBName = deviceB.manufacturer + deviceB.name;
        return deviceAName.localeCompare(deviceBName);
    });

    // Clear the device list
    container.innerHTML = "";

    if(deviceList.length === 0) {
        container.innerHTML = '<p>No devices found. Please connect a device and click reload.</p>';
        return;
    }

    // TODO: Uncomment when implementing auto-reload on start
    // reloadLinkContainer.style.display = deviceList.length > 0 ? 'block' : 'none';

    for (const device of deviceList) {
        container.appendChild(createDeviceSelectorItem(device));
    }

    // If there is only one device, select it
    if (deviceList.length == 1) {
        selectDevice(container.firstElementChild);
    }
}

function setInstallButtonsEnabled(enabled) {
    const installButtons = document.querySelectorAll('.install');
    const manualInstallButton = document.getElementById('manual-install-btn');

    installButtons.forEach(button => button.disabled = !enabled);
    manualInstallButton.disabled = !enabled;
}

function performSearch() {
    const searchField = document.getElementById('search-field');
    const searchTerm = searchField.value.toLowerCase();

    // Use cached package list for filtering
    const filteredPackages = searchTerm === '' ? cachedPackages : cachedPackages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm) ||
        (pkg.author && pkg.author.toLowerCase().includes(searchTerm))
    );

    renderPackageList(filteredPackages, searchTerm);
    updateResultsCount(filteredPackages.length, searchTerm);
    setInstallButtonsEnabled(selectedDeviceItem !== null); // Disable buttons if no board is selected
}

function renderPackageList(packages, searchTerm) {
    const packageList = document.getElementById('package-list');
    packageList.innerHTML = '';

    packages.forEach(pkg => {
        const isExactMatch = pkg.name.toLowerCase() === searchTerm;

        const packageItem = document.createElement('li');
        packageItem.className = 'package-item';

        let authorHTML = pkg.author ? `by ${pkg.author}` : '';
        let descriptionHTML = pkg.description ? `<div class="package-description">${pkg.description}</div>` : '';
        let tagsHTML = pkg.tags && pkg.tags.length ? `<div class="package-tags">${pkg.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : '';
        let licenseHTML = pkg.license ? `<div class="package-license">Licensed under ${pkg.license}</div>` : '';

        packageItem.innerHTML = `
            <div class="package-info">
                <div class="package-title-container">
                    <div class="package-title">📦 ${pkg.name} <span class="author">${authorHTML}</span></div>
                    ${isExactMatch ? `<span class="exact-match-tag">Exact Match</span>` : ''}
                </div>
                ${descriptionHTML}
                ${tagsHTML}
                ${licenseHTML}
            </div>
            <div class="package-buttons">
                <button class="install primary">Install</button>
                <button class="read-more link">More info</button>
            </div>
        `;

        packageList.appendChild(packageItem);

        const divider = document.createElement('div');
        divider.className = 'package-divider';
        packageList.appendChild(divider);

        const installButton = packageItem.querySelector('.install');
        const moreInfoButton = packageItem.querySelector('.read-more');

        installButton.addEventListener('click', () => {
            installPackage(pkg);
        });

        moreInfoButton.addEventListener('click', () => {
            openPackageInfo(pkg.url);
        });
    });
}

function toggleUserInteraction(enabled) {
    const installButtons = document.querySelectorAll('.install');
    const searchField = document.getElementById('search-field');
    const githubUrlInput = document.getElementById('github-url');
    const manualInstallButton = document.getElementById('manual-install-btn');
    const boardItems = document.querySelectorAll('.selection-item');    

    // Disable UI components
    installButtons.forEach(button => button.disabled = !enabled);
    searchField.disabled = !enabled;
    githubUrlInput.disabled = !enabled;
    manualInstallButton.disabled = !enabled;
    reloadDeviceListLink.style.pointerEvents = enabled ? 'auto' : 'none';
    boardItems.forEach(board => board.style.pointerEvents = enabled ? 'auto' : 'none');

    if(enabled){
        setInstallButtonsEnabled(selectedDeviceItem != null); // Re-enable buttons only if a board is selected
    }
}

async function installPackage(package) {
    if (!selectedDeviceItem) {
        throw new Error('No board selected.');
    }
    const serialPort = selectedDeviceItem.dataset.port;
    const packageDesignator = package.name || package.url;
    toggleUserInteraction(false);
    showOverlay();
    showStatus(`⌛️ Installing ${packageDesignator} on board at ${serialPort}...`);
    
    const result = await window.api.installPackage(package, serialPort);

    if (result.success) {
        showStatus(`✅ '${packageDesignator}' installation complete on ${selectedDeviceItem.dataset.name}.`);
    } else {
        showStatus(`❌ Failed to install '${packageDesignator}': ${result.error}`);
    }

    toggleUserInteraction(true);
    hideOverlay();
}

function openPackageInfo(url) {
    if (url) {
        window.open(url, '_blank'); // Opens the URL in a new browser tab
    } else {
        alert('No information available for this package.');
    }
}

function updateResultsCount(count, searchTerm) {
    const resultsCount = document.getElementById('results-count');
    if (searchTerm) {
        resultsCount.textContent = `${count} package${count !== 1 ? 's' : ''} found`;
        resultsCount.style.display = 'block';
    } else {
        resultsCount.style.display = 'none';
    }
}

function getPackages() {
    return [
        {
            title: "Example Package 1",
            author: "Arduino",
            description: "A Python client for the Arduino IoT cloud.",
            tags: ["cloud", "iot"],
            license: "MIT"
        },
        {
            title: "Example Package 2",
            author: "OpenAI",
            description: "A package for advanced language models.",
            tags: ["AI", "NLP"],
            license: "Apache-2.0"
        },
        // Add more packages here
    ];
}

function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById('advanced-options');
    const disclosureIcon = document.getElementById('disclosure-icon');
    
    if (!advancedOptions.classList.contains('visible')) {
        advancedOptions.classList.add('visible');
        disclosureIcon.innerHTML = '&#9662;'; // Downward-pointing triangle (▼)
    } else {
        advancedOptions.classList.remove('visible');
        disclosureIcon.innerHTML = '&#9656;'; // Right-pointing triangle (▶)
    }
}

async function manualInstall() {
    const githubUrl = document.getElementById('github-url').value;

    if (githubUrl.trim() === '') {
        alert('Please enter a valid GitHub URL.');
        return;
    }

    await installPackage({ url: githubUrl });
}

function showStatus(message, duration = null) {
    const statusBar = document.getElementById('status-bar');
    const statusMessage = document.getElementById('status-message');

    statusMessage.textContent = message;
    statusBar.style.display = 'block';

    // Add the visible class to trigger the slide down effect
    setTimeout(() => {
        statusBar.classList.add('visible');
    }, 10);

    if (duration) {
        // Automatically hide the status after given duration
        setTimeout(hideStatus, duration);
    }
}

function hideStatus() {
    const statusBar = document.getElementById('status-bar');

    // Remove the visible class to trigger the slide-up effect
    statusBar.classList.remove('visible');

    // After the transition ends, hide the element
    setTimeout(() => {
        statusBar.style.display = 'none';
    }, 500); // Match this duration with the CSS transition duration
}

function showOverlay() {
    const overlay = document.getElementById('overlay');
    
    // Display the overlay and then trigger the fade-in effect
    overlay.style.display = 'block';
    
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
}

function hideOverlay() {
    const overlay = document.getElementById('overlay');
    
    // Trigger the fade-out effect
    overlay.classList.remove('visible');
    
    // After the fade-out transition ends, hide the element
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 500); // Match this duration with the CSS transition duration
}