# git_clone_issue

This extension adds a "Clone" button to issues. That button will open the new issue form populated with the original issue data. This extension can also provide "Clone" buttons on the issues list. It accepts a list of repositories in the configuration to provide a "Clone to" button, so you can clone the issue to the current repository or to another repository.

It can generate new issues based on predefined templates that are created, edited and deleted from the options page. We know GitHub's issue templates system, but in our use case, there are too many periodic task templates for the client and other providers to be comfortable... Probably, we are not the only ones with that kind of problem.

Make it yours, tweak what you don't like. Sure, the code is not top-notch, the formatting might be a bit wonky, but hey, it gets the job done (most of the time :D).

## Installation

Clone, fork or download this repository. If downloaded as ZIP, uncompress the file.

Add the extension to your browser, you have to choose the inner github_clone_issue_extension directory. For more information about how to add an unpacked extension ("developer mode") refer to your browser documentation. This extension have been checked to work with firefox, chrome, edge and opera.

Go to the extension options page by clicking in the extension icon, then options.

By default, the "Clone" button will only appear on the issue page (not in the list), "New from template" is disabled, and the cloned issue title will be prefixed with "CLONED ". Chack the desired boxes to enable them.

To be able to clone to other repositories you will have to add them in the configuration. Use the full url.

Depending on your own repositories configuration (out of https://github.com) you may need to provide a token (fine grained, including issues:read). For more information about valid tokens check [GitHub REST API documentation](https://docs.github.com/en/enterprise-server@3.12/rest/issues/issues?apiVersion=2022-11-28#get-an-issue)

For firefox users is available as packed extension at https://addons.mozilla.org/en-US/firefox/addon/github-issue-clone.
