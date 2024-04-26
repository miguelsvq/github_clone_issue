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
        status.textContent = 'Saved!';
        setTimeout(() => {
        status.textContent = '';
        }, 750);
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
      const status = document.getElementById('status');
      status.textContent = 'Saved!';
      setTimeout(() => {
      status.textContent = '';
      }, 1500);
    }
  );
};

const newId = () => {
  let k=0;
  const used=Object.keys(extTemplates);
  while(used.includes('id_'+k)){
    k++;
  }
  return 'id_'+k;
}

const templateToForm = (id) => {
  document.getElementById('id').value = extTemplates[id]['id'];
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
        extTemplates['id_0'];
        extTemplates['id_0']={};
        extTemplates['id_0']['label']='Example template';
        extTemplates['id_0']['title']='Title from example template';
        extTemplates['id_0']['body']='###Description\n\nGo to options page (from menu extension) to create, edit and delete templates.';
        extTemplates['id_0']['assignees']=['miguelsvq','mpereram'];
        extTemplates['id_0']['labels']=['bug','wontfix'];
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

const storeTemplates = (action) => {
  chrome.storage.local.set(
    { extTemplates: extTemplates},
    () => {
      const status = document.getElementById('status');
      status.textContent = action;
         setTimeout(() => {
         status.textContent = '';
      }, 1500);
      populateTemplatesList()
    }
  );
}
const clearForm = () =>{
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
  if(!id) id=newId();
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

document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('store').addEventListener('click', storeTemplate);
document.getElementById('clear').addEventListener('clear', clearForm);
document.getElementById('delete').addEventListener('click', deleteTemplate);
