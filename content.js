let titlePrefix = 'CLONED';
let buttonsInList = false;
let buttonInIssuePage = true;
let newWithTemplate = false;

chrome.storage.local.get('extOptions', ({ extOptions }) => {
    if (extOptions) {
        ({ titlePrefix, buttonsInList, buttonInIssuePage, newWithTemplate } = extOptions);
    }
});

let gitToken = false;
let patterns = [];

const manifestData = chrome.runtime.getManifest();
const url = new URL(manifestData.content_scripts[0].matches[0]);
const issuePattern = new RegExp(`${url.origin.replaceAll('.', '\\.')}/.*/issues/[0-9]*`);
const issueListPattern = new RegExp(`${url.origin.replaceAll('.', '\\.')}/.*/issues$`);

chrome.storage.local.get('gitToken', ({ gitToken: storedGitToken }) => {
    gitToken = storedGitToken || '';
});

const init = () => {
    if (buttonInIssuePage && issuePattern.test(window.location.href) && document.querySelector('.gh-header-actions')) {
        addButton();
    }
    if (buttonsInList && issueListPattern.test(window.location.href)) {
        addCloneButtonToIssueLinks();
    }
    if (newWithTemplate && issueListPattern.test(window.location.href)) {
        addNewFromTemplateButton();
    }
};

const addButton = () => {
    if (!document.getElementById('ext_clone')) {
        const cloneButton = document.createElement('button');
        cloneButton.id = 'ext_clone';
        cloneButton.className = 'Button Button--small Button--secondary flex-md-order-2';
        cloneButton.textContent = 'Clone';
        cloneButton.onclick = () => cloneIssue(false);
        const headerActions = document.querySelector('.gh-header-actions');
        if (headerActions) {
            headerActions.appendChild(cloneButton);
        }
    }
};

const addNewFromTemplateButton = () => {
    const url = new URL(window.location.href);
    const parts = url.pathname.split('/');
    if (parts.length < 3) return;
    const newIssueURL = `/${parts[1]}/${parts[2]}/issues/new/choose`;
    const createURL = `/${parts[1]}/${parts[2]}/issues/new?`;
    const newIssueLinks = document.querySelectorAll(`a[href="${newIssueURL}"]:not(.ext_processed)`);
    const templateListExists = document.querySelectorAll('.templatesList').length;
    if (!templateListExists && newIssueLinks.length) {
        fetch(chrome.runtime.getURL("templates.json"))
            .then(response => response.json())
            .then(templateData => {
                const templatesList = document.createElement('div');
                templatesList.classList.add('templatesList');
                const templateLinksContainer = document.createElement('div');
                templateLinksContainer.classList.add('templatesLinks');
                const trigger = document.createElement('div');
                trigger.textContent = "New from template";
                trigger.classList.add('templatesTrigger');
                trigger.onclick = (e) => e.target.classList.toggle('open');
                templatesList.append(trigger, templateLinksContainer);
                templateData.forEach(template => {
                    const templateLink = document.createElement('a');
                    templateLink.classList.add('newWithTemplate');
                    templateLink.href = getTemplateURL(createURL, template);
                    templateLink.target = '_blank';
                    templateLink.textContent = template.title;
                    templateLinksContainer.appendChild(templateLink);
                });
                newIssueLinks.forEach(link => {
                    link.classList.add('ext_processed');
                    link.parentNode.appendChild(templatesList);
                });
            })
            .catch(console.error);
    }
};

const getTemplateURL = (createURL, template) => {
    createURL += `title=${encodeURIComponent(template.title)}`;
    if (template.body) createURL += `&body=${encodeURIComponent(template.body)}`;
    if (template.milestone) createURL += `&milestone=${encodeURIComponent(template.milestone)}`;
    if (template.labels && template.labels.length) createURL += `&labels=${encodeURIComponent(template.labels.join(','))}`;
    if (template.assignees && template.assignees.length) createURL += `&assignees=${encodeURIComponent(template.assignees.join(','))}`;
    return createURL;
};

const addCloneButtonToIssueLinks = () => {
    const url = new URL(window.location.href);
    if (url.pathname.match('/.+/.+/issues$') || url.pathname.match('/.+/.+/issues/$')) {
        const issueLinks = document.querySelectorAll(`.js-issue-row a[href^="${url.pathname}"][id^="issue_"]:not(.ext_processed)`);
        issueLinks.forEach(issueLink => {
            issueLink.classList.add('ext_processed');
            const cloneButton = document.createElement('div');
            cloneButton.className = 'Button Button--secondary';
            cloneButton.textContent = 'Clone';
            cloneButton.dataset.extIssue = issueLink.href;
            cloneButton.onclick = () => cloneIssue(cloneButton.getAttribute("data-ext-issue"));
            issueLink.parentNode.after(cloneButton);
        });
    }
};

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
        const parts = url.pathname.split('/');
        parts.pop();
        parts.pop();
        const clonedIssue = {
            title: titlePrefix + issueData.title,
            body: issueData.body,
            milestone: (issueData.milestone && issueData.milestone.number) ? issueData.milestone.number : undefined,
            labels: (issueData.labels && issueData.labels.map(label => label.name)) || [],
            assignees: (issueData.assignees && issueData.assignees.map(assignee => assignee.login)) || [],
        };
        const createURL = url.origin + parts.join('/') + '/issues/new?';
        const newIssueURL = getTemplateURL(createURL, clonedIssue);
        window.open(newIssueURL, '_blank');
    })
    .catch(console.error);
};

let timer;
const config = { attributes: false, childList: true, subtree: true };
const callback = (mutationList, observer) => {
    let trigger = false;
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            trigger = true;
            break;
        }
    }
    if (trigger) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(init, 250); // Ensure .gh-header-actions is already there
    }
};
const observer = new MutationObserver(callback);
observer.observe(document, config);

init();
