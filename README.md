# git_clone_issue

This extension adds a "Clone" button to issues. That button will open the new issue form populated with the original issue data. This extension can also provide "Clone" buttons on the issues list and generate new issues based on predefined templates (templates.json). We know GitHub's issue templates system, but in our use case, there are too many periodic task templates for the client and other providers to be comfortable... Probably, we are not the only ones with that kind of problem.

To use it on GitHub Enterprise versions, edit the manifest.json file and replace https://github.com with the base URL of your repository.

Set options by clicking on the extension icon and selecting options... quite simple. By default, the "Clone" button will only appear on the issue page (not in the list), "New from template" is disabled, and the cloned issue title will be prefixed with "CLONED ".

Make it yours, tweak what you don't like. Sure, the code is not top-notch, the formatting might be a bit wonky, but hey, it gets the job done (most of the time :D).

If you want the extension packed you can download it from https://github.com/miguelsvq/github_clone_issue_extension

Current code include "Clone to another repository" feature. No yet available in the packet extension.
