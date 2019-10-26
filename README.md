<div align="center">
	<h1 style="font-weight:bold;">envbot ⚙️</h1>
    <p>Seamlessly update your teammates on Slack when .env changes locally </p>
</div>

## Motivation

While having a `.env.example` file committed to source control might help in letting teammates know that certain environmental variables are required to get up and running with a project on their dev machines, getting them the values can be a pain. Even worse, alerting them when any of those values (or variables) change can be a drag.

Enter `envbot` 💪🏾

## Description

`envbot` automates the process of keeping your teammates in the loop when an environmental variable name (or even value) changes by securely notifying them on slack.

## Installation

```sh
$ npm install -D sync-dotenv-slack
```

## Usage

To use this package, you first need to create a slack app for your slack workspace, and grab two tokens; a bot token, and a user token.

Check out this quick primer on how to get your tokens 👉🏾 [get your slack tokens](https://gist.github.com/akhilome/6268ef912895af4224b421719e68df3c)

The bot token starts with `xoxb` and has the following format:

```
xoxb-******-******-******
```

while the user token starts with `xoxp` and has the following format:

```
xoxp-*****-*****-*****-*****
```

Upon retrieving your tokens, add them to your environment variables like so:

```
ENVBOT_SLACK_BOT_TOKEN=xoxb-******-******-******
ENVBOT_SLACK_USER_TOKEN=xoxp-*****-*****-*****-*****
```

With the environment setup complete, you can now move on to configuring your application to make use of `envbot`.

### The `envbot` object

In configuring your project to use envbot, an `envbot` object needs to be added to your project's `package.json` like so:

```jsonc
    ...
    "envbot": {
        "channel": "channel_name",
        "include": ["*"]
    }
    ...
```

#### `channel`

The `channel` property would be used to instruct the bot which channel to post to. Channels specified here can be private or public slack channels.

#### `include`

The `include` property can be used to specify which environment variable values to include when the bot is posting to slack.

It can be utilized in the following ways:

##### Including all variables (and respective their keys)

```jsonc
    ...
    "envbot": {
        "channel": "channel_name",
        "include": ["*"]
    }
    ...
```

##### Including only some variable keys with their values

With this option, all the environment keys would still be uploaded, but values would only be included for the specified variables.

```jsonc
    ...
    "envbot": {
        "channel": "channel_name",
        "include": ["VAR_1", "VAR_2", "VAR_3"]
    }
    ...
```

##### Excluding some variable keys' values

With this option, all the environment keys would be uploaded with their keys, except from the ones specified in the `include` array with a negation (`!`) before thier name.

```jsonc
    ...
    "envbot": {
        "channel": "channel_name",
        "include": ["!VAR_4", "VAR_5"]
    }
    ...
```

### Configuring Your Project to Autorun Envbot

We recommended you configure your project to auto-run `envbot` right before every commit using a precommit hook.

Configuring precommit hooks for a node project is pretty straight-forward using `husky`. Just install husky (`npm install -D husky`) if you are not using it already and add the following to your `package.json`:

```js
// package.json
{
  "scripts": {
    "sync-env-slack": "envbot"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run sync-env-slack",
    }
  }
}
```

## License

This project is licensed under
[MIT](https://github.com/codeshifu/sync-dotenv-slack/blob/master/LICENSE)
