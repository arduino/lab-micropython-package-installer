document.addEventListener('DOMContentLoaded', () => {
    // Display all packages when the app starts
    performSearch();
});

function performSearch() {
    const searchField = document.getElementById('search-field');
    const searchTerm = searchField.value.toLowerCase();
    const packages = getPackages(); // Replace with actual API call or data source

    const filteredPackages = searchTerm === '' ? packages : packages.filter(pkg => 
        pkg.title.toLowerCase().includes(searchTerm) ||
        pkg.author.toLowerCase().includes(searchTerm)
    );

    renderPackageList(filteredPackages, searchTerm);
    updateResultsCount(filteredPackages.length, searchTerm);
}

function renderPackageList(packages, searchTerm) {
    const packageList = document.getElementById('package-list');
    packageList.innerHTML = '';

    packages.forEach(pkg => {
        const isExactMatch = pkg.title.toLowerCase() === searchTerm;

        const packageItem = document.createElement('li');
        packageItem.className = 'package-item';
        packageItem.innerHTML = `
            <div class="package-info">
                <div class="package-title-container">
                    <div class="package-title">${pkg.title} by ${pkg.author}</div>
                    ${isExactMatch ? `<span class="exact-match-tag">Exact Match</span>` : ''}
                </div>
                <div class="package-description">${pkg.description}</div>
                <div class="package-tags">
                    ${pkg.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="package-license">Licensed under ${pkg.license}</div>
            </div>
            <div class="package-buttons">
                <button class="install">Install</button>
                <button class="read-more">More info</button>
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
            openPackageInfo(pkg);
        });
    });
}

function installPackage(pkg) {
    const statusField = document.getElementById('status');
    statusField.textContent = `Installing ${pkg.title}...`;

    setTimeout(() => {
        statusField.textContent = `${pkg.title} installation complete.`;
    }, 2000);
}

function openPackageInfo(pkg) {
    alert(`More info about ${pkg.title}...`);
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
    
    if (advancedOptions.style.display === 'none') {
        advancedOptions.style.display = 'block';
        disclosureIcon.innerHTML = '&#9662;'; // Downward-pointing triangle (▼)
    } else {
        advancedOptions.style.display = 'none';
        disclosureIcon.innerHTML = '&#9656;'; // Right-pointing triangle (▶)
    }
}

function manualInstall() {
    const githubUrl = document.getElementById('github-url').value;
    const statusField = document.getElementById('status');

    if (githubUrl.trim() === '') {
        alert('Please enter a valid GitHub URL.');
        return;
    }

    statusField.textContent = `Installing from ${githubUrl}...`;

    // Simulate installation process
    setTimeout(() => {
        statusField.textContent = `Installation from ${githubUrl} complete.`;
    }, 2000);
}