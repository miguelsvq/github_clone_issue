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
  const token = document.getElementById('token').value;
  if(token){
    chrome.storage.local.set(
    { gitToken: token},
    () => {
      const status = document.getElementById('status');
      document.getElementById('token').setAttribute('placeholder','Token already stored.');
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
document.getElementById('save').addEventListener('click', saveOptions);

var fileChooser = document.createElement("input");
fileChooser.type = 'file';
fileChooser.addEventListener('change', function (evt) {
  var f = evt.target.files[0];
  if(f) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var str = e.target.result;
      template=JSON.parse(str);
      const status = document.getElementById('status');
      if(!template.id){
        status.textContent = 'Error! Id is required.';
         setTimeout(() => {
         status.textContent = '';
        }, 1500);
      }else{
        addTemplate(template);
      }
    }
    reader.readAsText(f);
  }
});
document.getElementById('loadTemplate').append(fileChooser);

const addTemplate = (jsonTemplate) => {
  const action = extTemplates[jsonTemplate.id] ? 'Changed!' : 'Added!';
  extTemplates[jsonTemplate.id]=jsonTemplate;
  storeTemplates(action);
}

const populateTemplatesList = () => {
  const list = document.getElementById('templatesList');
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  for (const id in extTemplates) {
    const title = extTemplates[id]['title'] ? extTemplates[id]['title'] : '-Untitled-';
    const li = document.createElement("li");
    li.textContent = '('+id+') '+ title;
    list.append(li);
  }
}

const deleteTemplate = (id) => {

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