# sync-dotenv-slack
> Keep .env in sync with teammates on Slack

![sync-dotenv-slack-demo](https://media.giphy.com/media/Xd744GG44wZWXJzdJb/giphy.gif)

![Travis (.org)](https://img.shields.io/travis/codeshifu/sync-dotenv-slack) [![Coverage Status](https://coveralls.io/repos/github/codeshifu/sync-dotenv-slack/badge.svg?branch=master)](https://coveralls.io/github/codeshifu/sync-dotenv-slack?branch=master)

While having a `.env.example` file committed to source control might help in letting teammates know that certain environmental variables are required to get up and running with a project, getting them the values can be a pain. Even worse, alerting them when any of those values (or variables) changes can be a drag.

`sync-dotenv-slack` automates the process of keeping your teammates in the loop when `.env` changes (locally) by securely notifying them on Slack.

## Features
- Automatic synchronization when env (key/value) changes
- Securely upload env contents as a file snippet to Slack channel
- Private/Public Slack channel support
- Exclude/Include specific env (values) to upload

## Table of contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Configuration](#config)
- [Contributing](#contributing)
- [License](#license)
- [Contributors](#contributors)


## Prerequisites
- [Slack](https://slack.com/downloads)

## Installation

```sh
$ npm install -D sync-dotenv-slack
```

## Setup
- Create a Slack app (with required permissions) for your workspace. [Follow this guide](https://gist.github.com/akhilome/6268ef912895af4224b421719e68df3c)
- Add Slack app tokens to your project `.env`
  ```
  ENVBOT_SLACK_BOT_TOKEN=xoxb-******-******-******
  ENVBOT_SLACK_USER_TOKEN=xoxp-*****-*****-*****-*****
  ```

## Usage
To use this tool, an `envbot` object needs to be added to your project's `package.json` like so. See the [config](#config) section for more info

```js
// package.json
  "scripts": {
    ...
    "sync-dotenv-slack": "envbot"
  },
  "envbot": {
    "channel": "general",
    "include": ["*", "!SECRET"]
  }
```
You can then run `$ npm run sync-dotenv-slack`

or

Automagically sync before every push using [husky](https://github.com/typicode/husky) or similar tool (**recommended**)
```diff
{
    ...
+   "husky": {
+    "hooks": {
+      "pre-push": "npm run sync-dotenv-slack"
+     }
+   }
}
```

## Config
You can configure the `envbot` object with the following options in package.json

#### channel
Type: `string`

Slack channel (name) to post/upload env to.

#### include
Type: `[string]`

An array of environment variable(s) to include/exclude their values when posting to Slack.


##### Using the include option

```bash
# include all env values
["*"]

# include all env values but AWS_SECRET
["!AWS_SECRET"]

# ignore all env values but DB_NAME
["!TOKEN", "DB_NAME"] 

# ignore all env values but DB_NAME & DB_HOST
["DB_NAME", "DB_HOST"]
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

This project is licensed under
[MIT](https://github.com/codeshifu/sync-dotenv-slack/blob/master/LICENSE)

## Contributors
- [akhilome](https://github.com/akhilome)
- [codeshifu](https://github.com/codeshifu)
