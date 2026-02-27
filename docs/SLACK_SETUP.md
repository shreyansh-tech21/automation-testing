# Slack integration setup

Use this guide to create a Slack app and get the credentials needed for notifications and the `/run` slash command.

---

## Step 1 — Create Slack app and enable features

1. Go to **https://api.slack.com/apps**
2. Click **Create New App** → **From scratch**
3. **App Name:** e.g. `Automation Testing` → **Pick a workspace** → **Create App**
4. In the app sidebar, enable:
   - **Slash Commands** (add command in Step 2)
   - **Bot Token Scopes:** add `chat:write` (OAuth & Permissions)
   - **Incoming Webhooks** (optional, for simple “post to one channel” notifications)

---

## Step 2 — Create slash command `/run`

1. In the app, open **Slash Commands** → **Create New Command**
2. **Command:** `/run`
3. **Request URL:**
   - **Production:** `https://yourdomain.com/slack/command`
   - **Local:** use **ngrok**: `npm install -g ngrok` then `ngrok http 5000` → copy the **HTTPS** URL and use `https://xxxx.ngrok.io/slack/command`
4. **Short description:** e.g. `Run automation suite by profile`
5. **Save**

---

## Step 3 — Install app and get tokens

1. **OAuth & Permissions** → **Install to Workspace** → **Allow**
2. Copy the **Bot User OAuth Token** (`xoxb-...`) → set as `SLACK_BOT_TOKEN` in `.env`
3. **Basic Information** → **App Credentials** → copy **Signing Secret** → set as `SLACK_SIGNING_SECRET` in `.env`

---

## Step 4 — Backend .env

In `backend/.env` add:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
```

Restart the backend. In Slack, type `/run` or `/run smoke` (profile defaults to `smoke` if omitted).

---

## Troubleshooting: `/run` does nothing or “failed to run”

1. **Slack must be able to reach your server**
   - Slash commands are sent by Slack’s servers to the **Request URL** you configured. If the backend runs only on `localhost`, Slack cannot reach it and the command will fail (often with no visible error in Slack).
   - **Fix:** Expose your backend with a public URL. For local dev, use [ngrok](https://ngrok.com): run `ngrok http 5000` (or your `PORT`), then in the Slack app set **Slash Commands** → **Request URL** to `https://YOUR-NGROK-HOST.ngrok.io/slack/command` (path must be exactly `/slack/command`).
   - Free ngrok URLs change each time you restart ngrok; update the Request URL in the Slack app when that happens.

2. **Request URL path**
   - The backend route is `POST /slack/command` (no `/api` prefix). Use `https://your-domain-or-ngrok/slack/command`.

3. **Check backend logs**
   - When you type `/run`, the backend should log: `[Slack] /run command received, profile from text: ...`
   - If you see `[Slack] Signing secret not configured` → set `SLACK_SIGNING_SECRET` in `backend/.env`.
   - If you see `[Slack] Invalid signature` → copy the **Signing Secret** again from Slack app **Basic Information** → **App Credentials** and set `SLACK_SIGNING_SECRET` (no extra spaces).
   - If you see no log at all when you run `/run` → Slack is not reaching your server; fix the Request URL (and ngrok if local).

4. **Optional: skip signature verification (dev only)**
   - To rule out signing issues: set `SKIP_SLACK_VERIFY=1` in `.env`, restart the backend, and try `/run` again. Only use this for local debugging; never in production.

---

## Optional: Incoming Webhook (one-channel notifications)

Best for: “Post test results to one channel.” No OAuth.

### 1. Create the app

1. Go to **https://api.slack.com/apps**
2. Click **Create New App**
3. Choose **From scratch**
4. **App Name:** e.g. `Automation Testing`
5. **Pick a workspace:** your Slack workspace
6. Click **Create App**

### 2. Enable Incoming Webhooks

1. In the app sidebar, open **Incoming Webhooks**
2. Turn **Activate Incoming Webhooks** **On**
3. At the bottom, click **Add New Webhook to Workspace**
4. Choose the **channel** where you want messages (e.g. `#qa-automation`)
5. Click **Allow**
6. Copy the **Webhook URL** (from Slack; add it only to `backend/.env`, never commit it)

### 3. Add to your backend

In `backend/.env` add:

```env
SLACK_WEBHOOK_URL=<paste the URL from Slack here>
```

Restart the backend. Test runs will post to that channel when configured (see backend code).

---

## Option B: Bot token (post to any channel, more control)

Best for: posting to multiple channels or using Slack API features.

### 1. Create the app

1. Go to **https://api.slack.com/apps**
2. **Create New App** → **From scratch**
3. Name and workspace → **Create App**

### 2. Add OAuth scope

1. Sidebar: **OAuth & Permissions**
2. Under **Scopes** → **Bot Token Scopes**, click **Add an OAuth Scope**
3. Add **`chat:write`** (and optionally **`chat:write.public`** if you want to post to channels without inviting the bot)
4. Save

### 3. Install app to workspace

1. In the same **OAuth & Permissions** page, top section
2. Click **Install to Workspace**
3. Review and **Allow**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 4. Add to your backend

In `backend/.env`:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL_ID=C0123456789
```

To get a **channel ID**: open the channel in Slack → click the channel name → scroll down; or use the Slack API (e.g. `conversations.list`) to list channels.

---

## Summary

| Method              | .env variable         | Use case                    |
|---------------------|------------------------|-----------------------------|
| Incoming Webhook    | `SLACK_WEBHOOK_URL`   | One channel, minimal setup  |
| Bot token           | `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID` | Multiple channels, more API use |

Start with **Option A** (webhook); add **Option B** later if you need it.
