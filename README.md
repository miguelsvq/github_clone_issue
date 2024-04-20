# git_clone_issue

This extension adds a "Clone" button to issues. That button will open the new issue form populated with the original issue data. This extension can also provide "Clone" buttons on the issues list. It accepts a list of repositories in the configuration to provide a "Clone to" button, so you can clone the issue to the current repository or to another repository.

It can generate new issues based on predefined templates (templates.json). We know GitHub's issue templates system, but in our use case, there are too many periodic task templates for the client and other providers to be comfortable... Probably, we are not the only ones with that kind of problem.

Set options by clicking on the extension icon and selecting options... quite simple. By default, the "Clone" button will only appear on the issue page (not in the list), "New from template" is disabled, and the cloned issue title will be prefixed with "CLONED ". To be able to clone to other repositories you will have to add them in the configuration. To work with your own repositories (out of https://github.com) you may need to provide a token (fine grained, including issues:read). More information about valid tokens check </a href="https://docs.github.com/en/enterprise-server@3.12/rest/issues/issues?apiVersion=2022-11-28#get-an-issue">the REST API documentation</a>.

Make it yours, tweak what you don't like. Sure, the code is not top-notch, the formatting might be a bit wonky, but hey, it gets the job done (most of the time :D).
