chrome.storage.local.get('gitToken', function(items) {
    if(items.gitToken){
      document.getElementById('token').setAttribute('placeholder','Token already stored.');
    }else{
      document.getElementById('token').setAttribute('placeholder','No token stored yet.');
    }
  });
chrome.storage.local.get('extOptions', function(items) {
    if(items.extOptions){
      document.getElementById('titlePrefix').value=items.extOptions.titlePrefix;
      document.getElementById('titleSuffix').value=items.extOptions.titleSuffix;
      document.getElementById('descriptionPrefix').value=items.extOptions.descriptionPrefix;
      document.getElementById('descriptionSuffix').value=items.extOptions.descriptionSuffix;
      document.getElementById('buttonsInList').checked = items.extOptions.buttonsInList;
      document.getElementById('buttonInIssuePage').checked = items.extOptions.buttonInIssuePage;
      document.getElementById('newWithTemplate').checked = items.extOptions.newWithTemplate;
      let otherRepos=items.extOptions.otherRepos;
      if(otherRepos){otherRepos=otherRepos.join('\n');}
      document.getElementById('otherRepos').value = otherRepos;
    }
  });
let extTemplates={};
chrome.storage.local.get('extTemplates', function(items) {
    if(items.extTemplates){
      extTemplates=items.extTemplates;
      populateTemplatesList();
    }
  });
  
const saveOptions = () => {
  let token = document.getElementById('token').value;
  if(token){
    if(token=='-') token = null;
    chrome.storage.local.set(
    { gitToken: token},
    () => {
      const status = document.getElementById('status');
      if(token) {
        document.getElementById('token').setAttribute('placeholder','Token already stored.');
      }else{
        document.getElementById('token').setAttribute('placeholder','Token deleted.');
      }
        document.getElementById('token').value="";
        setStatus( 'Saved!');
      }
    );
  }
  var extOptions={};
  extOptions.titlePrefix=document.getElementById('titlePrefix').value;
  extOptions.titleSuffix=document.getElementById('titleSuffix').value;
  extOptions.descriptionPrefix=document.getElementById('descriptionPrefix').value;
  extOptions.descriptionSuffix=document.getElementById('descriptionSuffix').value;
  extOptions.buttonsInList=document.getElementById('buttonsInList').checked;
  extOptions.buttonInIssuePage=document.getElementById('buttonInIssuePage').checked;
  extOptions.newWithTemplate=document.getElementById('newWithTemplate').checked;
  extOptions.otherRepos=document.getElementById('otherRepos').value.split('\n');
  chrome.storage.local.set(
    { extOptions: extOptions},
    () => {
      setStatus( 'Saved!');
    }
  );
};

const setStatus = (str) =>{
	const status = document.getElementById('status');
      status.textContent = str;
      status.classList.remove('off');
      setTimeout(() => {
      status.textContent = '';status.classList.add('off');
      }, 1500);
}
const templateToForm = (id) => {
  document.getElementById('id').value = id;
  document.getElementById('label').value = extTemplates[id]['label'];
  document.getElementById('title').value = extTemplates[id]['title'] ? extTemplates[id]['title'] : '';
  document.getElementById('body').value = extTemplates[id]['body'] ? extTemplates[id]['body'] : '';
  document.getElementById('assignees').value = extTemplates[id]['assignees'] ? extTemplates[id]['assignees'].join(', ') : '';
  document.getElementById('labels').value = extTemplates[id]['labels'] ? extTemplates[id]['labels'].join(', ') : '';
  document.getElementById('delete').classList.add('visible');
}

const populateTemplatesList = () => {
  const list = document.getElementById('templatesList');
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  if(!Object.keys(extTemplates).length){
        //example
        extTemplates={};
        const uuid = crypto.randomUUID();
        extTemplates[uuid];
        extTemplates[uuid]={};
        extTemplates[uuid]['label']='Example template';
        extTemplates[uuid]['id']=uuid;
        extTemplates[uuid]['title']='Title of this example template';
        extTemplates[uuid]['body']='###Description\n\nGo to options page (from menu extension) to create, edit and delete templates.';
        extTemplates[uuid]['assignees']=['miguelsvq','mpereram'];
        extTemplates[uuid]['labels']=['bug','wontfix'];
        storeTemplates('');
    }
  for (const id in extTemplates) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = extTemplates[id].label;
    li.append(span);
    li.dataset.id=id;
    li.onclick = () => templateToForm(li.dataset.id);
    list.append(li);
  }
}

const sanitizeTemplates = (templates) => {
  let sanitized={};
  for (const id in templates) {
    if(id.match('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') && id == templates[id]['id'] && templates[id]['label']){
      sanitized[id]={};
      sanitized[id]['label']=templates[id]['label'];
      sanitized[id]['id']=id;
      if(templates[id]['title'] && typeof templates[id]['title'] === 'string'){
        sanitized[id]['title']=templates[id]['title'];
	  }
	  if(templates[id]['body'] && typeof templates[id]['body'] === 'string'){
        sanitized[id]['body']=templates[id]['body'];
	  }
      if(templates[id]['assignees'] && Array.isArray(templates[id]['assignees'])){
		let ok=true;
		for(let k=0;k<templates[id]['assignees'].length;k++){
		  if(typeof templates[id]['assignees'][k] !== 'string'){
			  ok=false;
			  break;
		  }
		}
        if(ok){
			sanitized[id]['assignees']=templates[id]['assignees'];
		}
	  }
	  if(templates[id]['labels'] && Array.isArray(templates[id]['labels'])){
		let ok=true;
		for(let k=0;k<templates[id]['labels'].length;k++){
		  if(typeof templates[id]['labels'][k] !== 'string'){
			  ok=false;
			  break;
		  }
		}
        if(ok){
			sanitized[id]['labels']=templates[id]['labels'];
		}
	  }
    }
  }
  return sanitized;
}

const storeTemplates = (action) => {
  chrome.storage.local.set(
    { extTemplates: extTemplates},
    () => {
      setStatus(action);
      populateTemplatesList()
    }
  );
}
const clearForm = () =>{
	console.log('clearform');
  document.getElementById('delete').classList.remove('visible');
  document.getElementById('id').value = '';
  document.getElementById('label').value = '';
  document.getElementById('title').value = '';
  document.getElementById('body').value = '';
  document.getElementById('assignees').value = '';
  document.getElementById('labels').value = '';
}
const storeTemplate = () => {
  if(!document.getElementById('label').value) {
    document.getElementById('label').classList.add('error');
    setTimeout(() => {
         document.getElementById('label').classList.remove('error');
      }, 1000);
    return;
  }
  let id = document.getElementById('id').value;
  if(!id) id=crypto.randomUUID();
  if(!extTemplates[id]) extTemplates[id]={};
  extTemplates[id]['id']=id;
  extTemplates[id]['label']=document.getElementById('label').value;
  extTemplates[id]['title']=document.getElementById('title').value;
  extTemplates[id]['body']=document.getElementById('body').value;
  extTemplates[id]['assignees'] = document.getElementById('assignees').value.split(",").map(function(item) {return item.trim();});
  extTemplates[id]['labels'] =document.getElementById('labels').value.split(",").map(function(item) {return item.trim();});;
  clearForm();
  storeTemplates('Change stored!')
}
const deleteTemplate = () => {
  let id = document.getElementById('id').value;
  if(!id) return;
  clearForm();
  delete extTemplates[id];
  storeTemplates('Deleted!')
}
const importTemplates = (collection) => {
  clearForm();
  collection = sanitizeTemplates(collection);
  for (const id in collection) {
    extTemplates[id]=collection[id];
  }
  storeTemplates('Imported!');
  fileChooser();
}

const importFromUrl = () => {
  clearForm();
  const url = document.getElementById('importUrl').value;
  if(!url){return;}
  fetch(url, {
        method: 'GET'
     })
    .then(response => response.json())
    .then(data => {
        importTemplates(data)
    });
}
const exportTemplates = () => {
  const data = JSON.stringify(extTemplates,null,2); 
  const file = new File([data], 'templates.json', {
    type: 'application/json',
  })
  const link = document.createElement('a')
  const url = URL.createObjectURL(file)
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
const fileChooser = () =>{
  const list = document.getElementById('import');
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
	var fileChooser = document.createElement("input");
	fileChooser.type = 'file';
	fileChooser.accept = 'application/json';
	fileChooser.addEventListener('change', function (evt) {
	  var f = evt.target.files[0];
	  if(f) {
	    var reader = new FileReader();
	    reader.onload = function(e) {
	      var str = e.target.result;
	      collection=JSON.parse(str);
	      importTemplates(collection);
	    }
	    reader.readAsText(f);
	  }
	});
	document.getElementById('import').append(fileChooser);
}

fileChooser();
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('store').addEventListener('click', storeTemplate);
document.getElementById('clear').addEventListener('click', clearForm);
document.getElementById('delete').addEventListener('click', deleteTemplate);
document.getElementById('export').addEventListener('click', exportTemplates);
//document.getElementById('importFromUrl').addEventListener('click', importFromUrl);
