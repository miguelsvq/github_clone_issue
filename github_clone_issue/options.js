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
      }, 750);
    }
    );
};
document.getElementById('save').addEventListener('click', saveOptions);