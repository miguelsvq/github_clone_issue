// Constants
const TITLE_PREFIX = 'CLONED ';

// Initialize extension options
let extOptions = {
    titlePrefix: TITLE_PREFIX,
    buttonsInList: false,
    buttonInIssuePage: true,
    newWithTemplate: false
};

// Initialize GitHub token
let gitToken = '';

// Initialize URL patterns
let issuePattern;
let issueListPattern;

// Fetch extension options from storage
chrome.storage.local.get(['extOptions', 'gitToken'], ({ extOptions: storedExtOptions, gitToken: storedGitToken }) => {
    extOptions = storedExtOptions || extOptions;
    gitToken = storedGitToken || gitToken;

    // Set URL patterns
    const manifestData = chrome.runtime.getManifest();
    const url = new URL(manifestData.content_scripts[0].matches[0]);
    issuePattern = new RegExp(`${url.origin.replaceAll('.', '\\.')}/.*/issues/[0-9]*`);
    issueListPattern = new RegExp(`${url.origin.replaceAll('.', '\\.')}/.*/issues$`);

    // Initialize extension
    init();
});

// Initialize extension
const init = () => {
    addButton();
    addCloneButtonToIssueLinks();
    addNewFromTemplateButton();
};

// Add "Clone" button to issue page
const addButton = () => {
    if (extOptions.buttonInIssuePage && !document.getElementById('ext_clone') && issuePattern.test(window.location.href) && document.querySelector('.gh-header-actions')) {
        const cloneButton = createCloneButton();
        const headerActions = document.querySelector('.gh-header-actions');
        if (headerActions) {
            headerActions.appendChild(cloneButton);
        }
    }
};

// Create "Clone" button element
const createCloneButton = () => {
    const cloneButton = document.createElement('button');
    cloneButton.id = 'ext_clone';
    cloneButton.className = 'Button Button--small Button--secondary flex-md-order-2';
    cloneButton.textContent = 'Clone';
    cloneButton.onclick = () => cloneIssue(false);
    return cloneButton;
};

// Add "New from template" button to issues list
const addNewFromTemplateButton = () => {
    if (extOptions.newWithTemplate && issueListPattern.test(window.location.href)) {
        const newIssueLinks = document.querySelectorAll(`a[href^="${getNewIssueURL()}"]:not(.ext_processed)`);
        if (!document.querySelectorAll('.templatesList').length && newIssueLinks.length) {
            fetchTemplateData();
        }
    }
};

// Fetch template data and add "New from template" button
const fetchTemplateData = () => {
    fetch(chrome.runtime.getURL("templates.json"))
        .then(response => response.json())
        .then(templateData => {
            const templatesList = createTemplatesList(templateData);
            const newIssueLinks = document.querySelectorAll(`a[href^="${getNewIssueURL()}"]:not(.ext_processed)`);
            newIssueLinks.forEach(link => {
                link.classList.add('ext_processed');
                link.parentNode.appendChild(templatesList);
            });
        })
        .catch(console.error);
};

// Create templates list element
const createTemplatesList = (templateData) => {
    const templatesList = document.createElement('div');
    templatesList.classList.add('templatesList');
    const templateLinksContainer = document.createElement('div');
    templateLinksContainer.classList.add('templatesLinks');
    const trigger = createTemplateTrigger();
    templatesList.append(trigger, templateLinksContainer);
    templateData.forEach(template => {
        const templateLink = createTemplateLink(template);
        templateLinksContainer.appendChild(templateLink);
    });
    return templatesList;
};

// Create "New from template" trigger element
const createTemplateTrigger = () => {
    const trigger = document.createElement('div');
    trigger.textContent = "New from template";
    trigger.classList.add('templatesTrigger');
    trigger.onclick = (e) => e.target.classList.toggle('open');
    return trigger;
};

// Create template link element
const createTemplateLink = (template) => {
    const templateLink = document.createElement('a');
    templateLink.classList.add('newWithTemplate');
    templateLink.href = getTemplateURL(template);
    templateLink.target = '_blank';
    templateLink.textContent = template.title;
    return templateLink;
};

// Add "Clone" button to each issue link in the list
const addCloneButtonToIssueLinks = () => {
    if (extOptions.buttonsInList && issueListPattern.test(window.location.href)) {
        const issueLinks = document.querySelectorAll(`.js-issue-row a[href^="${issueURLPattern}"][id^="issue_"]:not(.ext_processed)`);
        issueLinks.forEach(issueLink => {
            issueLink.classList.add('ext_processed');
            const cloneButton = createCloneButton();
            cloneButton.dataset.extIssue = issueLink.href;
            cloneButton.onclick = () => cloneIssue(cloneButton.dataset.extIssue);
            issueLink.parentNode.after(cloneButton);
        });
    }
};

// Get URL for creating a new issue
const getNewIssueURL = () => {
    const url = new URL(window.location.href);
    const parts = url.pathname.split('/');
    if (parts.length >= 3) {
        return `/${parts[1]}/${parts[2]}/issues/new`;
    }
    return '';
};

// Base to build creation urls
const createURL = getNewIssueURL()+'?';

// Pattern to detect issues links
const getIssueURLPattern = () => {
    const url = new URL(window.location.href);
    const parts = url.pathname.split('/');
    if (parts.length >= 3) {
        return `/${parts[1]}/${parts[2]}/issues/`;
    }
    return '';
};
// Pattern to detect issues links
const issueURLPattern = getIssueURLPattern();

// Clone issue based on provided link or current page URL
const cloneIssue = (issueLink) => {
    if (!issueLink) issueLink = window.location.href;
    const url = new URL(issueLink);
    const issueAPIURL = (url.origin !== 'https://github.com')
        ? `${url.origin}/api/v3/repos${url.pathname}`
        : `https://api.github.com/repos${url.pathname}`;

    fetch(issueAPIURL, {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github+json',
        },
    })
    .then(response => response.json())
    .then(issueData => {
        const clonedIssue = {
            title: extOptions.titlePrefix + issueData.title,
            body: issueData.body,
            milestone: (issueData.milestone && issueData.milestone.number) ? issueData.milestone.number : undefined,
            labels: (issueData.labels && issueData.labels.map(label => label.name)) || [],
            assignees: (issueData.assignees && issueData.assignees.map(assignee => assignee.login)) || [],
        };
        const newIssueURL = getTemplateURL(clonedIssue);
        window.open(newIssueURL, '_blank');
    })
    .catch(console.error);
};

// Get template URL for creating a new issue
const getTemplateURL = (template) => {
    let url = createURL + `title=${encodeURIComponent(template.title)}`;
    if (template.body) url += `&body=${encodeURIComponent(template.body)}`;
    if (template.milestone) url += `&milestone=${encodeURIComponent(template.milestone)}`;
    if (template.labels && template.labels.length) url += `&labels=${encodeURIComponent(template.labels.join(','))}`;
    if (template.assignees && template.assignees.length) url += `&assignees=${encodeURIComponent(template.assignees.join(','))}`;
    return url;
};


// Handle mutations in the DOM
const handleDOMMutations = (mutationList, observer) => {
    let trigger = false;
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            trigger = true;
            break;
        }
    }
    if (trigger) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(init, 100); // Ensure .gh-header-actions is already there
    }
};
// Create observer to monitor DOM mutations
let timer;
const observer = new MutationObserver(handleDOMMutations);
observer.observe(document, { attributes: false, childList: true, subtree: true });
