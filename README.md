# Simulator ReadMe

The Simulator is a tool that allows users to set up small simulations/games, consisting of pages with Multiple Choice questions. Functionalities include:

- Show the user a series of *multiple choice* questions.
- Per answer option, specify direct feedback, as well as which *follow-up page* should be next.
- Add *variables* like "health points" or "food supply" that are updated based on the user's choices.
- Allow for *events*: when a certain condition is met on the variables, like "hp < 10", then a specific in-between page or alternate path is triggered.

This allows for a large variety of games to be made, from simple adventure stories to educational business simulations.

## Set-up of the website

This website is open-source. It's made using [Vite](https://vitejs.dev/) for development and [React](https://react.dev/) for front-end interactivity, and it uses [Firebase](https://firebase.google.com/) for its authentication, database and storage. It's set up as a Progressive Web App (PWA) to allow it to be added as an app on smartphones. It supports dark mode and light mode.

Want to contribute to programming this web-app? Then head to the [source folder](./src/) to learn more about how all the files are structured.
