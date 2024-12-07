"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeBot = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Handles the OAuth2 flow to authenticate a user and add them to a guild (server).
 *
 * @param {string} code - The OAuth2 authorization code.
 * @param {OAuthConfig} config - The configuration object containing clientId, clientSecret, redirectUri, apiEndpoint, guildId, and botToken.
 * @returns {Promise<Object>} A promise that resolves with the user information and success message, or an error message if the process fails.
 */
function oAuth(code, config) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      const data = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: config.redirectUri,
      });
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      const tokenResponse = yield axios_1.default.post(
        `${config.apiEndpoint}/oauth2/token`,
        data,
        {
          headers: headers,
          auth: {
            username: config.clientId,
            password: config.clientSecret,
          },
        },
      );
      const accessToken = tokenResponse.data.access_token;
      const userResponse = yield axios_1.default.get(
        `${config.apiEndpoint}/users/@me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const addUserToGuildResponse = yield axios_1.default.put(
        `${config.apiEndpoint}/guilds/${config.guildId}/members/${userResponse.data.id}`,
        { access_token: accessToken },
        {
          headers: {
            Authorization: `Bot ${config.botToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (
        addUserToGuildResponse.status === 201 ||
        addUserToGuildResponse.status === 204
      ) {
        return {
          message: "User added to guild successfully",
          user: userResponse.data,
        };
      } else {
        return { error: "Failed to add user to the guild" };
      }
    } catch (error) {
      console.error(error);
      return { error: "Failed to fetch user information or add to guild" };
    }
  });
}
/**
 * Authorizes the bot and completes the OAuth2 process to add a user to a guild.
 *
 * @param {Client} client - The Discord selfbot client.
 * @param {string} authURL - The authorization URL generated for the OAuth2 flow.
 * @param {OAuthConfig} config - The configuration object containing clientId, clientSecret, redirectUri, apiEndpoint, guildId, and botToken.
 * @returns {Promise<Object>} A promise that resolves with the user information and success message, or an error message if the process fails.
 */
function authorizeBot(client, authURL, config) {
  return __awaiter(this, void 0, void 0, function* () {
    const data = yield client.authorizeURL(authURL);
    const code = data.location.split("=")[1];
    const response = yield oAuth(code, config);
    return response;
  });
}
exports.authorizeBot = authorizeBot;
