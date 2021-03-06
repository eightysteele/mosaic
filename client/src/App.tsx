import * as React from "react";
import { BrowserRouter, Route, Redirect } from "react-router-dom";
import { ApolloProvider } from "react-apollo";
import { Provider } from "react-redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";
import "bootstrap/dist/css/bootstrap.min.css";

import { client } from "./graphqlClient";

import { EpisodeShowPage } from "./pages/EpisodeShowPage";
import { ExperimentShowPage } from "./pages/ExperimentShowPage";
import { NextEpisodeShowPage } from "./pages/NextEpisodeShowPage";
import { NextMaybeSuboptimalEpisodeShowPage } from "./pages/NextMaybeSuboptimalEpisodeShowPage";
import { BetweenEpisodesPage } from "./pages/BetweenEpisodesPage";
import { RootWorkspacePage } from "./pages/RootWorkspacePage";
import { applyMiddleware, combineReducers, createStore } from "redux";
import { blockReducer } from "./modules/blocks/reducer";
import { blockEditorReducer } from "./modules/blockEditor/reducer";
import { WorkspaceSubtreePage } from "./pages/WorkspaceSubtreePage";
import { CompactTreeView } from "./pages/CompactTreeView";
import { WorkspaceHistoryView } from "./pages/SnapshotView";
import { ListenerThatClosesPointersOnPathnameChange } from "./components/ListenerThatClosesPointersOnPathnameChange";
import { Header } from "./components/Header";
import { Auth } from "./auth";

// set up FullStory identity
if (Auth.isAuthenticated()) {
  Auth.getProfile(() => {
    return;
  }).catch(err => console.log(err));
}

const store = createStore(
  combineReducers({
    blocks: blockReducer,
    blockEditor: blockEditorReducer,
  } as any),
  composeWithDevTools(applyMiddleware(thunk)),
);

export class Layout extends React.Component {
  public render() {
    return (
      <div className="Layout">
        <Header />
        {this.props.children}
      </div>
    );
  }
}

const Routes = () => (
  <div>
    <Route exact={true} path="/workspaces" render={() => <Redirect to="/" />} />
    <Route exact={true} path="/" component={RootWorkspacePage} />
    <Route exact={true} path="/next" component={NextEpisodeShowPage} />
    <Route
      exact={true}
      path="/nextMaybeSuboptimal"
      component={NextMaybeSuboptimalEpisodeShowPage}
    />
    <Route exact={true} path="/break" component={BetweenEpisodesPage} />
    <Route
      exact={true}
      path="/workspaces/:workspaceId"
      component={EpisodeShowPage}
    />
    <Route exact={true} path="/w/:workspaceId" component={EpisodeShowPage} />
    <Route
      exact={true}
      path="/experiments/:experimentId"
      component={ExperimentShowPage}
    />
    <Route
      exact={true}
      path="/e/:experimentId"
      component={ExperimentShowPage}
    />
    <Route
      exact={true}
      path="/workspaces/:workspaceId/subtree"
      component={WorkspaceSubtreePage}
    />
    <Route
      exact={true}
      path="/w/:workspaceId/subtree"
      component={WorkspaceSubtreePage}
    />
    <Route
      exact={true}
      path="/workspaces/:workspaceId/compactTree"
      component={CompactTreeView}
    />
    <Route
      exact={true}
      path="/w/:workspaceId/compactTree"
      component={CompactTreeView}
    />
    <Route
      exact={true}
      path="/snapshots/:workspaceId"
      component={WorkspaceHistoryView}
    />
    <Route
      path="/authCallback"
      render={props => {
        if (/access_token|error/.test(props.location.hash)) {
          Auth.handleAuthentication(() => {
            location.assign(Auth.getPreAuthUrl());
            Auth.clearPreAuthUrl();
          });
        }
        return <Redirect to="/" />;
      }}
    />
    <ListenerThatClosesPointersOnPathnameChange />
  </div>
);

class App extends React.Component {
  public render() {
    return (
      <ApolloProvider client={client}>
        <Provider store={store}>
          <BrowserRouter>
            <Layout>
              <Routes />
            </Layout>
          </BrowserRouter>
        </Provider>
      </ApolloProvider>
    );
  }
}

export { App };
