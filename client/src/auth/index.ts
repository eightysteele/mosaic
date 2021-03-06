import * as auth0 from "auth0-js";
import gql from "graphql-tag";
// Note: uses local storage instead of redux to persist across sessions
// May consider alternate architecture ie through the redux-localstorage package
import { Config } from "../config";
import { client } from "../graphqlClient";

const MOSAIC_PRE_AUTH_URL = "MOSAIC_PRE_AUTH_URL";

export class Auth {
  public static auth0 = new auth0.WebAuth({
    domain: "mosaicapp.auth0.com",
    clientID: Config.auth0_client_id,
    redirectUri: Auth.redirectUri(),
    audience: "https://mosaicapp.auth0.com/userinfo",
    responseType: "token",
    scope: "openid email profile user_metadata app_metadata",
  });

  public static login(): void {
    Auth.savePreAuthUrl();
    Auth.auth0.authorize();
  }

  public static savePreAuthUrl(): void {
    localStorage.setItem(MOSAIC_PRE_AUTH_URL, window.location.href);
  }

  public static getPreAuthUrl(): string {
    return localStorage.getItem(MOSAIC_PRE_AUTH_URL) || window.location.href;
  }

  public static clearPreAuthUrl(): void {
    localStorage.removeItem(MOSAIC_PRE_AUTH_URL);
  }

  public static logout(): void {
    // Clear Access Token and ID Token from local storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("user_id");

    // log out of FullStory
    if (window.FS) {
      window.FS.identify(false);
    }
    if (window.Intercom) {
      window.Intercom("shutdown");
    }
  }

  public static handleAuthentication(callback: () => void): void {
    if (Auth.isAuthenticated()) {
      return;
    }
    Auth.auth0.parseHash(async (err, authResult) => {
      if (authResult && authResult.accessToken) {
        const expiresAt = JSON.stringify(
          authResult.expiresIn * 1000 + Date.now(),
        );
        localStorage.setItem("access_token", authResult.accessToken);

        localStorage.setItem("expires_at", expiresAt);

        await Auth.getProfile(callback);
      } else if (err) {
        console.error("Authentication error: ", err);
        callback();
      }
    });
  }

  public static async getProfile(callback: () => void) {
    const root = "https://mosaic:auth0:com/";

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      callback();
      throw new Error("Access token must exist to fetch profile");
    }

    if (Auth.timeToLogOut() <= 0) {
      const USER_QUERY = gql`
        query userQuery($id: String) {
          user(id: $id) {
            id
            email
            givenName
            familyName
            isAdmin
          }
        }
      `;

      const userResponse = await client.query({
        query: USER_QUERY,
        variables: {
          id: Auth.userId(),
        },
      });

      const user = userResponse.data.user;

      localStorage.setItem("is_admin", user.isAdmin);

      const name = `${user.givenName} ${user.familyName}`;
      // configure FullStory & Intercom
      if (window.FS) {
        window.FS.identify(user.id, {
          displayName: name,
          email: user.email,
          isAdmin: user.isAdmin,
        });
      }

      if (window.Intercom) {
        window.Intercom("update", {
          user_id: user.id,
          name,
          email: user.email,
          isAdmin: user.isAdmin,
        });
      }

      if (window.heap) {
        window.heap.identify(user.email || user.id);
      }

      callback();
    } else {
      Auth.auth0.client.userInfo(accessToken, (err, profile) => {
        if (err) {
          console.error("Error retrieving user info: ", err);
          callback();
          return;
        }
        const appMetadata = profile[root + "app_metadata"];
        if (appMetadata != null && appMetadata.is_admin != null) {
          localStorage.setItem("is_admin", appMetadata.is_admin);
        }
        localStorage.setItem("user_id", profile.sub);

        const name = `${profile.given_name} ${profile.family_name}`;
        // configure FullStory
        if (window.FS) {
          window.FS.identify(profile.sub, {
            displayName: name,
            email: profile.email,
            isAdmin: appMetadata ? appMetadata.is_admin : false,
          });
        }

        if (window.Intercom) {
          window.Intercom("update", {
            user_id: profile.sub,
            name,
            email: profile.email,
            isAdmin: appMetadata ? appMetadata.is_admin : false,
          });
        }

        if (window.heap) {
          window.heap.identify(profile.email || profile.sub);
        }

        callback();
      });
    }
  }

  public static isAuthenticated(): boolean {
    return !!(
      localStorage.getItem("user_id") && localStorage.getItem("access_token")
    );
  }

  public static isAuthorizedToEditWorkspace(workspace?: any): boolean {
    if (workspace == null) {
      return false;
    }

    return Auth.isAuthenticated();
  }

  public static isAdmin(): boolean {
    if (!Auth.isAuthenticated()) {
      return false;
    }
    return localStorage.getItem("is_admin") === "true";
  }

  public static accessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  public static userId(): string | null {
    return localStorage.getItem("user_id");
  }

  public static timeToLogOut() {
    // returns ms left until the user logs out - negative if the user is not logged in
    const expiresJson = localStorage.getItem("expires_at");
    if (expiresJson === null) {
      return -1;
    }
    const expiresAt = Number(JSON.parse(expiresJson));
    return expiresAt - Date.now();
  }

  private static redirectUri(): string {
    return `${window.location.origin}/authCallback`;
  }
}
