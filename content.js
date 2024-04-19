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
const pattern = new RegExp(`${url.origin.replaceAll('.', '\\.')}/.*/issues/[0-9]*`);
const patternList = new RegExp(`${url.origin.replaceAll('.', '\\.')}/.*/issues$`);

chrome.storage.local.get('gitToken', ({ gitToken: storedGitToken }) => {
    gitToken = storedGitToken || '';
});

const init = () => {
    if (buttonInIssuePage && pattern.test(window.location.href) && document.querySelector('.gh-header-actions')) {
        addButton();
    }
    if (buttonsInList && patternList.test(window.location.href)) {
        cloneInLinks();
    }
    if (newWithTemplate && patternList.test(window.location.href)) {
        insertButtonNewWithTemplate();
    }
};

const addButton = () => {
    if (!document.getElementById('ext_clone')) {
        const bClone = document.createElement('button');
        bClone.id = 'ext_clone';
        bClone.className = 'Button Button--small Button--secondary flex-md-order-2';
        bClone.textContent = 'Clone';
        bClone.onclick = () => clone(false);
        if (document.querySelector('.gh-header-actions')) {
            document.querySelector('.gh-header-actions').appendChild(bClone);
        }
    }
};

const insertButtonNewWithTemplate = () => {
    const url = new URL(window.location.href);
    const parts = url.pathname.split('/');
    if (parts.length < 3) return;
    const new_issue_url = `/${parts[1]}/${parts[2]}/issues/new/choose`;
    const create_url = `/${parts[1]}/${parts[2]}/issues/new?`;
    const create_issue_links = document.querySelectorAll(`a[href="${new_issue_url}"]:not(.ext_processed)`);
    const exists = document.querySelectorAll('.templatesList').length;
    if (!exists && create_issue_links.length) {
        fetch(chrome.runtime.getURL("templates.json"))
            .then(response => response.json())
            .then(json => {
                const templateLinks = document.createElement('div');
                templateLinks.classList.add('templatesList');
                const container = document.createElement('div');
                container.classList.add('templatesLinks');
                const trigger = document.createElement('div');
                trigger.textContent = "New from template";
                trigger.classList.add('templatesTrigger');
                trigger.onclick = (e) => e.target.classList.toggle('open');
                templateLinks.append(trigger, container);
                json.forEach(item => {
                    const link = document.createElement('a');
                    link.classList.add('newWithTemplate');
                    link.href = urlFromTemplate(create_url, item);
                    link.target = '_blank';
                    link.textContent = item.title;
                    container.appendChild(link);
                });
                create_issue_links.forEach(link => {
                    link.classList.add('ext_processed');
                    link.parentNode.appendChild(templateLinks);
                });
            })
            .catch(console.error);
    }
};

const urlFromTemplate = (create_url, clone_json) => {
    create_url += `title=${encodeURIComponent(clone_json.title)}`;
    if (clone_json.body) create_url += `&body=${encodeURIComponent(clone_json.body)}`;
    if (clone_json.milestone) create_url += `&milestone=${encodeURIComponent(clone_json.milestone)}`;
    if (clone_json.labels && clone_json.labels.length) create_url += `&labels=${encodeURIComponent(clone_json.labels.join(','))}`;
    if (clone_json.assignees && clone_json.assignees.length) create_url += `&assignees=${encodeURIComponent(clone_json.assignees.join(','))}`;
    return create_url;
};

const cloneInLinks = () => {
    const url = new URL(window.location.href);
    if (url.pathname.match('/.+/.+/issues$') || url.pathname.match('/.+/.+/issues/$')) {
        const issuelinks = document.querySelectorAll(`.js-issue-row a[href^="${url.pathname}"][id^="issue_"]:not(.ext_processed)`);
        issuelinks.forEach(issuelink => {
            issuelink.classList.add('ext_processed');
            const bClone = document.createElement('div');
            bClone.className = 'Button Button--secondary';
            bClone.textContent = 'Clone';
            bClone.dataset.extIssue = issuelink.href;
            bClone.onclick = () => clone(bClone.getAttribute("data-ext-issue"));
            issuelink.parentNode.after(bClone);
        });
    }
};

const clone = (link) => {
    if (!link) link = window.location.href;
    const url = new URL(link);
    const issue_url = (url.origin !== 'https://github.com')
        ? `${url.origin}/api/v3/repos${url.pathname}`
        : `https://api.github.com/repos${url.pathname}`;

    fetch(issue_url, {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github+json',
            //'Authorization': 'Bearer '+gitToken, //Don't seems to be needed in github if have read access
        },
    })
    .then(response => response.json())
    .then(json => {
        const parts = url.pathname.split('/');
        parts.pop();
        parts.pop();
        const clone_json = {
            title: titlePrefix + json.title,
            body: json.body,
            milestone: (json.milestone && json.milestone.number) ? json.milestone.number : undefined,
            labels: (json.labels && json.labels.map(label => label.name)) || [],
            assignees: (json.assignees && json.assignees.map(assignee => assignee.login)) || [],
        };
        const create_url = url.origin + parts.join('/') + '/issues/new?';
        const new_issue_url = urlFromTemplate(create_url, clone_json);
        window.open(new_issue_url, '_blank');
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
