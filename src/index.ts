import { Client } from "discord.js-selfbot-v13";
import axios from "axios";

/**
 * The configuration object for OAuth2 authentication and bot setup.
 * @typedef {Object} OAuthConfig
 * @property {string} clientId - The Client ID of your Discord application.
 * @property {string} clientSecret - The Client Secret of your Discord application.
 * @property {string} redirectUri - The redirect URI used in OAuth2 flow.
 * @property {string} apiEndpoint - The Discord API endpoint.
 * @property {string} guildId - The ID of the guild (server) to add the user to.
 * @property {string} botToken - The Discord bot token used to authorize the bot.
 */
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiEndpoint: string;
  guildId: string;
  botToken: string;
}

/**
 * Handles the OAuth2 flow to authenticate a user and add them to a guild (server).
 *
 * @param {string} code - The OAuth2 authorization code.
 * @param {OAuthConfig} config - The configuration object containing clientId, clientSecret, redirectUri, apiEndpoint, guildId, and botToken.
 * @returns {Promise<Object>} A promise that resolves with the user information and success message, or an error message if the process fails.
 */
async function oAuth(code: string, config: OAuthConfig): Promise<Object> {
  try {
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: config.redirectUri,
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const tokenResponse = await axios.post(
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

    const userResponse = await axios.get(`${config.apiEndpoint}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const addUserToGuildResponse = await axios.put(
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
}

/**
 * Authorizes the bot and completes the OAuth2 process to add a user to a guild.
 *
 * @param {Client} client - The Discord selfbot client.
 * @param {string} authURL - The authorization URL generated for the OAuth2 flow.
 * @param {OAuthConfig} config - The configuration object containing clientId, clientSecret, redirectUri, apiEndpoint, guildId, and botToken.
 * @returns {Promise<Object>} A promise that resolves with the user information and success message, or an error message if the process fails.
 */
export async function authorizeBot(
  client: Client,
  authURL: string,
  config: OAuthConfig,
): Promise<Object> {
  const data = await client.authorizeURL(authURL);
  const code = data.location.split("=")[1];
  const response = await oAuth(code, config);

  return response;
}
