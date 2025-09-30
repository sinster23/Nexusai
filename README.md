
#  NexusAI – AI Story App

NexusAI is a React Native app built with Expo that lets users explore and play AI-generated stories. It features secure user authentication with firebase, story generation with gemini API and the most important feature is user can control the story based on his choices.


## Badges

![GitHub release downloads](https://img.shields.io/github/downloads/sinster23/Nexusai/total)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)



## Features

-  User Authentication – Secure login/signup with Firebase
-  Prfoile management - Efficient profile management with firebase db
-  OTP Verification - Secure OTP Verification with Nodemailer
-  AI Story Generator – Dynamic story generation powered by backend AI APIs
-  Story Creation - Creation and submission of creative stories from users
-  Custom UI – Smooth animated home screen with story cards
-  Cross-Platform – Runs on Android & iOS


## Tech Stack

| Frontend     | Authentication         | Server | Deployments    | AI API  |
|--------------|----------------|-----------|------------|----------------|
| React Native      | Firebase | Nodejs + express | Expo EAS + Vercel | Gemini |



## Run Locally

Clone the project

```bash
  git clone https://github.com/sinster23/Nexusai
```

Go to the project directory

```bash
  cd Nexusai
```

Install dependencies

```bash
  npm install
```

Start app

```bash
  cd app
  npx expo start
```

Start the server

```bash
  cd server
  node index
```


## Deployment

- Backend deployed on Vercel
- Mobile builds handled by Expo EAS
- Internal distribution available via EAS for testing
## Contributing

Contributions are always welcome!

For major changes, open an issue first to discuss what you’d like to change.


## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.


