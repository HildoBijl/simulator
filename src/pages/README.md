# Pages

This folder contains all pages for the web-app. Including a new page is quite simple.

- Create a new file in this folder that exports a React component. (Tip 1: copy an existing page. Tip 2: Add the export in the [index](./index.js) file for easy reference.)
- Define a route in the [Router](../router.jsx) file that uses this component.

That's all! Although of course making a good page takes a bit more work.

## Special pages

Apart from the usual pages, like [Home](./Home.jsx), [Account](./Account.jsx) and [Error](./Error.jsx), there are some more complicated pages.

- [simulations](./simulations/) contains all pages related to both editing and running simulations.

Check the respective folders for more information about how it's set up.
