# Firebase

This web-app uses Firebase for its database (Firestore), its authentication and its file storage. For that, it has the following files/folders.

- [main](./main.js) has the initialization script that sets up the connection to Firebase.
- [db](./db/) connects to the Firestore database. This folder also has functions/hooks to read/write data, on top of the standard Firebase functions/hooks.
- [auth](./auth/) deals with authenticating users. It sets up the Firebase functions related to it, and also sets up an authentication context, including hooks to read user data.
- [storage](./storage.js) handles the storage of files on the Firebase server. This is useful to for instance let users storage images.

To see which functions exist, check out the respective files and browse through the documentation within the source code.

For an easy overview of the database, of all users that have signed in, and all files that have been stored, check out the [Firebase console](https://console.firebase.google.com/project/simulator-54576/firestore). Don't have access yet? Ask the developers for access.
