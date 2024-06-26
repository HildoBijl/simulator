# What is this Simulator?

This Simulator is a web app that allows people (for instance teachers) to create small multiple-choice simulations for others (for instance their students). In these simulations, there are no right and wrong questions, but it's more a matter of "What would you do in this situation?" You can [https://simulator-54576.web.app/](try it out yourself)!


# Contribute to the Simulator

Want to get involved in developing the Simulator? Make sure to first set up your own development environment, and then potentially make changes.

## Setting up the development environment

First clone the git directory to your hard drive, and make sure you have Node with NPM installed. Then, from the terminal/command line, from the main directory, run

```
npm run dev
```

This should expose the app at http://localhost:5173/. Note that this is a local version of the code, but it does use the real database. So feel free to change the code, but be careful with database connections.

## Making changes

Once you have made changes in the code that you'd like to be implemented, push them to GitHub and set a pull request for the `main` branch. As soon as the code is merged into the `main` branch, the entire app is automatically rebundled and redeployed. (That only takes a minute or two.)


# Source code

The source code is divided into a large variety of folders. These can be split up into two types.

## Supporting directories

There are a few directories that are there for support. Probably you won't need to change them, or perhaps only add a tiny bit that you're missing.

- [util](./util/) has general Javascript utility functions that are useful across the website. Think of number calculation functions, object manipulation or extra React hooks.
- [components](./components/) has components that are useful across the site. Think of Page elements like an AppBar, or various Form components.
- [styling](./styling/) contains some site-wide style settings. (Components often have their own styling internally.)
- [firebase](./firebase/) deals with all interaction with the Firebase API. This includes authentication, database calls and file storage.

## Content

The content of the website is set up in the following files/folders.

- [assets](./assets/) contains basic files to be included in pages, like images and such.
- [pages](./pages/) has all the pages of the website defined. Anything that's related to rendering is stored in here.
- [simulations](./simulations/) has all the logic for reading/writing simulations from/to the database. (But not the actual simulation functionality scripts nor its rendering; those are in the pages folder.)
- [router](./router.jsx) contains the routes of the website: which URL points to which component?

Browse the various directories and you'll find additional ReadMes that help you further.
