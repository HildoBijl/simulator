# Source code

The source code is divided into a large variety of folders. These can be split up into two types.

### Supporting directories

There are a few directories that are there for support. Probably you won't need to change them, or perhaps only add a tiny bit that you're missing.

- [util](./util/) has general Javascript utility functions that are useful across the website. Think of number calculation functions, object manipulation or extra React hooks.
- [components](./components/) has components that are useful across the site. Think of Page elements like an AppBar, or various Form components.
- [styling](./styling/) contains some site-wide style settings. (Components often have their own styling internally.)
- [firebase](./firebase/) deals with all interaction with the Firebase API. This includes authentication, database calls and file storage.

### Content

The content of the website is set up in the following files/folders.

- [router](./router.jsx) contains the routes of the website: which URL points to which component?
- [assets](./assets/) contains basic files to be included in pages, like images and such.
- [pages](./pages/) has all the pages of the website defined. Anything that's related to rendering is stored in here.
- [simulations](./simulations/) has all the logic for reading/writing simulations from/to the database. (But not the actual simulation scripts; those are in the pages folder.)

Browse the various directories and you'll find additional ReadMes that help you further.
