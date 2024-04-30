// Constants
const TITLE_PREFIX = 'CLONED ';

// Initialize extension options
let extOptions = {
    titlePrefix: TITLE_PREFIX,
    buttonsInList: false,
    buttonInIssuePage: true,
    newWithTemplate: false,
    otherRepos: []
};

let validSite=false;
const meta=document.querySelector('meta[name="route-pattern"]');
if(meta && meta.getAttribute('content') && meta.getAttribute('content').includes('/issues')){
  validSite=true;
}
let timer;
let observer;
let gitToken = '';
let currentRepo = '';
// Fetch extension options from storage
chrome.storage.local.get(['extOptions', 'gitToken'], ({ extOptions: storedExtOptions, gitToken: storedGitToken }) => {
    extOptions = storedExtOptions || extOptions;
    gitToken = storedGitToken || gitToken;
    if(!validSite){
        return;
    }
    extOptions.otherRepos=extOptions.otherRepos.filter(function(e){return e}); 
    const url = new URL(window.location.href);
    const parts = url.pathname.split('/');
    if(parts.length>2){
        currentRepo=url.origin+'/'+parts[1]+'/'+parts[2];
    }
    if(!extOptions.otherRepos.includes(currentRepo) ){
        extOptions.otherRepos.unshift(currentRepo);
    }
    observer = new MutationObserver(handleDOMMutations);
    observer.observe(document, { attributes: false, childList: true, subtree: true });
    // Initialize extension
    init();
});

// Initialize extension
const init = () => {
    addButton();
    addCloneButtonToIssueLinks();
    addNewFromTemplateButton();
    document.body.addEventListener("click", function (evt) {
        if(evt.target.classList.contains('ext_trigger')){
            evt.target.classList.add('me');
        }
        const collection = document.querySelectorAll('.ext_trigger:not(.me)');
        collection.forEach(item => item.classList.remove('open'));
        evt.target.classList.remove('me');
    });
};

// check issues list page or issue
const pageType = () =>{
    const url = new URL(window.location.href);
    const parts = url.pathname.split('/');
    if(parts.length<4){
        return false;
    }
    if(parts[3]!='issues'){
        return false;
    }
    if(parts.length>4 && parts[4].match(/^\d+$/)){
        return 'issue';
    }
    return 'list';
};

// Add "Clone" button to issue page
const addButton = () => {
    if (extOptions.buttonInIssuePage && !document.getElementById('ext_clone') && pageType()=='issue' && document.querySelector('.gh-header-actions')) {
        const cloneButton = createCloneButton();
        const headerActions = document.querySelector('.gh-header-actions');
        if (headerActions) {
            headerActions.appendChild(cloneButton);
        }
    }
};

// Create "Clone" button element
const createCloneButton = (issueLinkHref) => {
    if(!issueLinkHref){
        issueLinkHref=window.location.href;
    }
    if(extOptions.otherRepos.length > 1){
        return createCloneToButtons(issueLinkHref);
    }
    const cloneButton = document.createElement('div');
    cloneButton.id = 'ext_clone';
    cloneButton.className = 'Button Button--small Button--secondary ext_button';
    cloneButton.textContent = 'Clone';
    cloneButton.dataset.extIssue = issueLinkHref;
    cloneButton.onclick = () => cloneIssue(cloneButton.dataset.extIssue,currentRepo);
    return cloneButton;
};

// Create "Clone to" button element
const createCloneToButtons = (issueLinkHref) => {
    const buttonsList = document.createElement('div');
    buttonsList.id = 'ext_clone';
    buttonsList.classList.add('buttonsList');
    const buttonsListContainer = document.createElement('div');
    buttonsListContainer.classList.add('buttonsContainer');
    const trigger = document.createElement('div');
    trigger.textContent = "Clone to";
    trigger.className = 'cloneToTrigger ext_trigger';
    trigger.onclick = (e) => e.target.classList.toggle('open');
    buttonsList.append(trigger, buttonsListContainer);
    const cloneButton = document.createElement('div');
    cloneButton.className = 'cloneButton';
    cloneButton.textContent = 'This repository';
    cloneButton.dataset.extIssue = issueLinkHref;
    cloneButton.onclick = () => cloneIssue(cloneButton.dataset.extIssue,currentRepo);
    buttonsListContainer.appendChild(cloneButton);
    extOptions.otherRepos.forEach(repo => {
        if(repo!=currentRepo){
        const cloneButton = document.createElement('div');
        cloneButton.className = 'cloneButton';
        cloneButton.textContent = repo;
        cloneButton.dataset.extIssue = issueLinkHref;
        cloneButton.onclick = () => cloneIssue(cloneButton.dataset.extIssue,repo);
        buttonsListContainer.appendChild(cloneButton);
        }
    });
    return buttonsList;
};

// Add "New from template" button to issues list
const addNewFromTemplateButton = () => {
    if (extOptions.newWithTemplate && pageType()=='list') {
        const newIssueLinks = document.querySelectorAll(`a[href^="${getNewIssueURL()}"]:not(.ext_processed)`);
        if (!document.querySelectorAll('.templatesList').length && newIssueLinks.length) {
            fetchTemplateData();
        }
    }
};

// Fetch template data and add "New from template" button
const fetchTemplateData = () => {
  chrome.storage.local.get('extTemplates', function(items) {
    if(!Object.keys(items.extTemplates).length){
        //example
        items.extTemplates={};
        items.extTemplates['id_0'];
        items.extTemplates['id_0']={};
        items.extTemplates['id_0']['label']='Example template';
        items.extTemplates['id_0']['title']='Title from example template';
        items.extTemplates['id_0']['body']='###Description\n\nGo to options page (from menu extension) to create, edit and delete templates.';
        items.extTemplates['id_0']['assignees']=['miguelsvq','mpereram'];
        items.extTemplates['id_0']['labels']=['bug','wontfix'];
    }
    if(Object.keys(items.extTemplates).length){
        const templatesList = createTemplatesList(items.extTemplates);
        const newIssueLinks = document.querySelectorAll(`a[href^="${getNewIssueURL()}"]:not(.ext_processed)`);
        newIssueLinks.forEach(link => {
            link.classList.add('ext_processed');
            link.parentNode.appendChild(templatesList);
        });
    }
  });
};

// Create templates list element
const createTemplatesList = (extTemplates) => {
    const templatesList = document.createElement('div');
    templatesList.classList.add('templatesList');
    const templateLinksContainer = document.createElement('div');
    templateLinksContainer.classList.add('templatesLinks');
    const trigger = createTemplateTrigger();
    templatesList.append(trigger, templateLinksContainer);
    for (const id in extTemplates) {
      const templateLink = createTemplateLink(extTemplates[id]);
      templateLinksContainer.appendChild(templateLink);
    }
    return templatesList;
};

// Create "New from template" trigger element
const createTemplateTrigger = () => {
    const trigger = document.createElement('div');
    trigger.textContent = "New from template";
    trigger.className='templatesTrigger ext_trigger';
    trigger.onclick = (e) => e.target.classList.toggle('open');
    return trigger;
};

// Create template link element
const createTemplateLink = (template) => {
    const templateLink = document.createElement('a');
    templateLink.classList.add('newWithTemplate');
    templateLink.href = getTemplateURL(template,currentRepo);
    templateLink.target = '_blank';
    templateLink.textContent = template.label;
    return templateLink;
};

// Add "Clone" button to each issue link in the list
const addCloneButtonToIssueLinks = () => {
    if (extOptions.buttonsInList && pageType()=='list') {
        const issueLinks = document.querySelectorAll(`.js-issue-row a[href^="${issueURLPattern}"][id^="issue_"]:not(.ext_processed)`);
        issueLinks.forEach(issueLink => {
            issueLink.classList.add('ext_processed');
            const cloneButton = createCloneButton(issueLink.href);
            cloneButton.removeAttribute('id');
            //cloneButton.dataset.extIssue = issueLink.href;
            //cloneButton.onclick = () => cloneIssue(cloneButton.dataset.extIssue,currentRepo);
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

//Check targer repository is same than origin repository
const sameRepo = (issueLink,repo) => {
    const from = new URL(issueLink);
    const to = new URL(repo);
    if(from.origin != to.origin) return false;
    if(from.pathname.split('/').slice(0,3).join('/')!=to.pathname.split('/').slice(0,3).join('/')) return false;
    return true;
}

// Clone issue based on provided link or current page URL
const cloneIssue = (issueLink,repo) => {
    if (!issueLink) issueLink = window.location.href;
    const url = new URL(issueLink);
    const issueAPIURL = (url.origin !== 'https://github.com')
        ? `${url.origin}/api/v3/repos${url.pathname}`
        : `https://api.github.com/repos${url.pathname}`;
    let headers = {
        'Accept': 'application/vnd.github+json',
    };
    if(url.origin !== 'https://github.com' && gitToken){
        headers['Authorization'] = 'Bearer '+gitToken;
        headers['X-GitHub-Api-Version']='2022-11-28';
    }
    fetch(issueAPIURL, {
        method: 'GET',
        headers: headers,
    })
    .then(response => response.json())
    .then(issueData => {
        let clonedIssue = {
            title: replaceTokens(extOptions.titlePrefix + issueData.title + extOptions.titleSuffix,issueData),
            body: replaceTokens(extOptions.descriptionPrefix + issueData.body + extOptions.descriptionSuffix,issueData),
            labels: (issueData.labels && issueData.labels.map(label => label.name)) || [],
            assignees: (issueData.assignees && issueData.assignees.map(assignee => assignee.login)) || [],
        };
        if(extOptions.assignTo && Array.isArray(extOptions.assignTo)){
          clonedIssue.assignees = extOptions.assignTo;
        }
        if(sameRepo(issueLink,repo) && issueData.milestone && issueData.milestone.number){
            clonedIssue['milestone'] = issueData.milestone.number;
        }
        const newIssueURL = getTemplateURL(clonedIssue,repo);
        window.open(newIssueURL, '_blank');
    })
    .catch(console.error);
};

const replaceTokens = (str,issueData) => {
	return str.replace(/{#}/g, issueData.number).replace(/{L}/g, issueData.html_url).replace(/{T}/g, issueData.title);
}
// Get template URL for creating a new issue
const getTemplateURL = (template,repo) => {
    const parts=[];
    if (template.title) parts.push( `title=${encodeURIComponent(template.title)}`);
    if (template.body) parts.push(`body=${encodeURIComponent(template.body)}`);
    if (template.milestone) parts.push(`milestone=${encodeURIComponent(template.milestone)}`);
    if (template.labels && template.labels.length) parts.push( `labels=${encodeURIComponent(template.labels.join(','))}`);
    if (template.assignees && template.assignees.length) parts.push(`assignees=${encodeURIComponent(template.assignees.join(','))}`);
    return repo+'/issues/new?'+parts.join('&');
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
        timer = setTimeout(init, 250);
    }
};


