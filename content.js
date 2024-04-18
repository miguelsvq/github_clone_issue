var titlePrefix='CLONED ';
var buttonsInList=false;
var buttonInIssuePage=true;
var newWithTemplate=false;

chrome.storage.local.get('extOptions', function(items) {
		if(items.extOptions){
			titlePrefix=items.extOptions.titlePrefix;
			buttonsInList = items.extOptions.buttonsInList;
			buttonInIssuePage = items.extOptions.buttonInIssuePage;
			newWithTemplate = items.extOptions.newWithTemplate;
			//newWithTemplate = false;//It's not working very well, sometimes inserts several buttons.
		}
	});

var gitToken=false;
var patterns=[];

var manifestData = chrome.runtime.getManifest();
var url= new URL(manifestData.content_scripts[0].matches[0]);
var pattern=url.origin.replaceAll('.','\\.')+'/.*/issues/[0-9]*' 
var patternList=url.origin.replaceAll('.','\\.')+'/.*/issues$' 

chrome.storage.local.get('gitToken', function(items) {
	if(items.gitToken){
	  gitToken=items.gitToken;
	}else{
	  chrome.storage.local.set({'gitToken':''});
	  gitToken='';
	}
});

function init(){
	if(buttonInIssuePage
		&& window.location.href.match(pattern)
		&& document.querySelector('.gh-header-actions'))
	{
		addButton();
	}
	if(buttonsInList && window.location.href.match(patternList)){
		cloneInLinks();
	}
	if(newWithTemplate && window.location.href.match(patternList)){
		insertButtonNewWithTemplate();
	}
}

function addButton(){
	if(!document.getElementById('ext_clone')){
	    var bClone = document.createElement('button');
	    bClone.id='ext_clone';
	    bClone.classList.add('Button');
	    bClone.classList.add('Button--small');
	    bClone.classList.add('Button--secondary');
	    bClone.classList.add('flex-md-order-2');
	    bClone.innerHTML='Clone';
	    bClone.onclick = function(ev) { clone(false); };
	    if(document.querySelector('.gh-header-actions')) document.querySelector('.gh-header-actions').appendChild(bClone);
	}
}
function insertButtonNewWithTemplate(){
	var url= new URL(window.location.href);
	const parts=url.pathname.split('/');
	if(parts.lengh<3){return;}
	const new_issue_url='/'+parts[1]+'/'+parts[2]+'/issues/new/choose';
	const create_url='/'+parts[1]+'/'+parts[2]+'/issues/new?';
	var create_issue_links=document.querySelectorAll('a[href="'+new_issue_url+'"]:not(.ext_processed)');
	var exists = document.querySelectorAll('.templatesList').length;
	if(!exists && create_issue_links.length){
		const url=chrome.runtime.getURL("templates.json");
		fetch(url).then((response) => response.json())
		.then((json) => {
			var templateLinks = document.createElement('div');
			templateLinks.classList.add('templatesList');
			var container=document.createElement('div');
			container.classList.add('templatesLinks');
			var trigger=document.createElement('div');
			trigger.innerHTML="New from template";
			trigger.classList.add('templatesTrigger');
			trigger.onclick = function(e) {e.target.classList.toggle('open') };
			templateLinks.append(trigger);
			templateLinks.append(container);
			for(var k=0;k<json.length;k++){
				var link=document.createElement('a');
				link.classList.add('newWithTemplate');
				link.setAttribute('href',urlFromTemplate(create_url,json[k]));
				link.setAttribute('target','_blank');
				link.innerHTML=json[k].title;
				container.append(link);
			}
			for(var k=0;k<create_issue_links.length;k++){
				create_issue_links[k].classList.add('ext_processed');
				create_issue_links[k].parentNode.appendChild(templateLinks);
			}
		}).catch((err) => {
			console.log(err);
		});
	}
}
function urlFromTemplate(create_url,clone_json){
//console.log(clone_json);
	create_url+='title='+encodeURIComponent(clone_json.title);
	if(clone_json.body){
		create_url+='&body='+encodeURIComponent(clone_json.body);
	}
	if(clone_json.milestone){
		create_url+='&milestone='+encodeURIComponent(clone_json.milestone);
	}
	if(clone_json.labels && clone_json.labels.length){
		create_url+='&labels='+encodeURIComponent(clone_json.labels.join(','));
	}
	if(clone_json.assignees && clone_json.assignees.length){
		create_url+='&assignees='+encodeURIComponent(clone_json.assignees.join(','));
	}
//console.log(create_url);
	return create_url;
}
function cloneInLinks(){
	var url= new URL(window.location.href);
	if(url.pathname.match('/.+/.+/issues$') || url.pathname.match('/.+/.+/issues/$')){
		var issuelinks=document.querySelectorAll('.js-issue-row a[href^="'+url.pathname+'"][id^="issue_"]:not(.ext_processed)');
		for(var k=0;k<issuelinks.length;k++){
			issuelinks[k].classList.add('ext_processed');
			var bClone = document.createElement('div');
			bClone.classList.add('Button');
			bClone.classList.add('Button--secondary');
			bClone.innerHTML='Clone';
			//console.log(issuelinks[k]);
			bClone.setAttribute('data-ext-issue',issuelinks[k].href);
			bClone.onclick = function(ev) { clone(this.getAttribute("data-ext-issue")); };
			issuelinks[k].parentNode.after(bClone);
		}
	}
}

function clone(link){
	if(! link){
	  link = window.location.href;
	}
	url=new URL(link);
	var issue_url;
	//API REST url to request issue seems to vary between my client repository (enterprise) and github
	if(url.origin!='https://github.com'){
		issue_url = url.origin+'/api/v3/repos'+url.pathname;
	}
	else{
		issue_url='https://api.github.com/repos'+url.pathname;
	}
	
	fetch(issue_url, {
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github+json',
			//'Authorization': 'Bearer '+gitToken, //Don't seems to be needed in github if have read access
			},
		}).then((response) => response.json())
		.then((json) => {
			var parts=url.pathname.split('/');
			parts.pop();
			parts.pop();
			var clone_json={};
			clone_json.title=titlePrefix+json.title;
			clone_json.body=json.body;
			if(json.milestone && json.milestone.number){
				clone_json.milestone=json.milestone.number;
			}
			if(json.labels && json.labels.length){
				var labels=[];
				for(var k=0;k<json.labels.length;k++){
					labels.push(json.labels[k].name)
				}
				clone_json.labels=labels;
			}
			if(json.assignees && json.assignees.length){
				var assignees=[];
				for(var k=0;k<json.assignees.length;k++){
					assignees.push(json.assignees[k].login)
				}
				clone_json.assignees=assignees;
			}
			var create_url=url.origin+parts.join('/')+'/issues/new?';
			create_url=urlFromTemplate(create_url,clone_json);
			window.open(create_url, '_blank');
			//Seems API REST create issue don't work using token auth if you are not the repo owner
			//I'll retry using fetch with the json and the API if I find the time
			//https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#create-an-issue
		}).catch((err) => {
			console.log(err);
		});
}
var ignore;
var timer;
const config = { attributes: false, childList: true, subtree: true };
const callback = (mutationList, observer) => {
  var trigger=false;
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      //observer.disconnect();
      //observer.observe(document, config);
      trigger=true;
    }
  }
  if(trigger){
    if(timer){clearTimeout(timer)}
    timer=setTimeout(init,250);//ensure .gh-header-actions is already there
  }
};
const observer = new MutationObserver(callback);
observer.observe(document, config);

init();

