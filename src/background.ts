function compareUrls(left: string, right: string) {
  const urlA = new URL(left);
  const urlB = new URL(right);
  return urlA.origin === urlB.origin;
}

async function onCompleted(details: any) {
  if (
    details.frameId == 0 &&
    details.url &&
    details.url != "" &&
    !details.url.match(/^chrome:\/\//)
  ) {
    chrome.tabs.get(details.tabId, async function (tab) {
      if (typeof tab == "undefined") return null;
      if (tab.url?.match(/^view-source:/)) return null;

      const tabs = await chrome.tabs.query({ currentWindow: true });

      const duplicates = tabs.filter(function (t) {
        return (
          compareUrls(t.url ?? "", details.url) && t.id != tab.id && !t.pinned
        );
      });
      if (duplicates.length) {
        removeDuplicates(tab, duplicates);
      }
    });
  }

  function removeDuplicates(
    tab: chrome.tabs.Tab,
    duplicates: chrome.tabs.Tab[]
  ) {
    const title = `Found ${duplicates.length} tab(s) with same URL`;
    const message = new URL(tab.url ?? "").hostname;
    const options = {
      type: "basic" as chrome.notifications.TemplateType,
      iconUrl: chrome.runtime.getURL("assets/icons/icon48.png"),
      title: title,
      message: message,
      contextMessage: "Click here to clean them up",
      isClickable: true,
    };

    let notificationId: string | null = null;

    chrome.notifications.create("", options, function (nId) {
      notificationId = nId;
    });

    chrome.notifications.onClicked.addListener(function (nId) {
      if (nId !== notificationId) return;
      duplicates.forEach(function (duplicate) {
        duplicate.id && chrome.tabs.remove(duplicate.id);
      });
      chrome.notifications.clear(notificationId, function () {});
      return false;
    });
  }
}

chrome.webNavigation.onCompleted.addListener(onCompleted);
