import { useAsyncRetry } from "react-use";
import { pickBy, groupBy, values, flatten } from "ramda";
import { MdOutlineCleanHands } from "react-icons/md";

import "./assets/css/App.css";

function App() {
  const state = useAsyncRetry(async () => {
    return await chrome.tabs.query({ currentWindow: true });
  });

  const closeTab = (tabId: number) => {
    chrome.tabs.remove(tabId);
    state.retry();
  };

  const goToTab = (tabId: number) => {
    chrome.tabs.update(tabId, { active: true });
  };

  if (state.loading) {
    return <div>Loading...</div>;
  }

  if (state.error) {
    return <div>Error: {state.error.message}</div>;
  }

  const tabs = state.value ?? [];

  const duplicatedOriginsGrouped = pickBy(
    (x) => x.length > 1,
    groupBy(
      (tab: chrome.tabs.Tab) => (tab.url ? new URL(tab.url).origin : "x"),
      tabs
    )
  );

  const duplicatedOriginsGroupedFlattened = flatten(
    values(duplicatedOriginsGrouped as any)
  );

  if (duplicatedOriginsGroupedFlattened.length === 0) {
    return (
      <div className="container container-empty">
        <p>Seems like you keep'em clean those tabs!</p>
        <div>
          <MdOutlineCleanHands />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>
        Tabs with same URL origin ({duplicatedOriginsGroupedFlattened.length})
      </h1>
      <div className="list">
        {duplicatedOriginsGroupedFlattened.map((tab) => (
          <div key={tab.id} className="listitem">
            <div className="listitem-icon">
              <img alt="" src={tab.favIconUrl} />
            </div>
            <div onClick={() => goToTab(tab.id)} className="listitem-name">
              {tab.title?.substring(0, 80)}
            </div>
            <button onClick={() => closeTab(tab.id)} className="listitem-close">
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
