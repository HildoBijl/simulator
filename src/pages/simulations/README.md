# Simulation logic and rendering

This folder contains all scripts related to rendering simulation pages, as well as the logic to execute simulations.

## Supporting files

First there are various supporting files that provide useful functionalities, both for editing and running simulations. For this, see the [util folder](./util).

## Rendering

To render simulations, we make a clear divide into developing simulations (creator side) and running simulations (user side).

- The [Create](./Create.jsx) page (main simulation overview list) and the [Edit](./Edit/) folder (adjusting one simulation) allows for creating/editing simulations. This is for the creators.
- The [Simulation](./Simulation/) folder contains all scripts for running simulations, including the simulation logic. This is for the users.

Check out the respective folders for further information.
