# Simulation logic and rendering

This folder contains all scripts related to rendering simulation pages, as well as the logic to execute simulations.

## Supporting files

First there are various supporting files that provide useful functionalities, both for editing and running simulations.

- [settings](./settings.js) has general simulation settings. This includes both functionality settings (like default values) as well as style settings.
- [util](./util.js) has general utility functions for simulations. Think of initializing functions of variables.
- [scripts](./scripts.js) has all functionalities for running user-provided scripts.
- [validation](./validation.js) has scripts that check if parts of a simulation are set up properly. Think of checking whether an update script has no programming errors.

## Rendering

To render simulations, we make a clear divide into developing simulations (creator side) and running simulations (user side).

- The [Create](./Create.jsx) page (main simulation overview list) and the [Edit](./Edit/) folder (adjusting one simulation) allows for creating/editing simulations. This is for the creators.
- The [Simulation](./Simulation/) folder contains all scripts for running simulations, including the simulation logic. This is for the users.

Check out the respective folders for further information.
