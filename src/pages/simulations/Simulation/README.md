# Simulation running

This is where all the functionalities for running a simulation preside.

## Simulation logic

The logic for the simulation - what should happen when a user does something - is in the [actions](./actions.js) file. This file returns a set of actions like `start`, `chooseOption`, `goToNextQuestion`. Each action updates the state accordingly. How that is done is specified in this file.

## General rendering

The [Simulation](./Simulation.jsx) file is the main component that is rendered. It pulls the ID from the URL, loads the simulation and then renders it. To do so, it uses various subpages.

- [StartPage](./subpages/StartPage.jsx) on the start, introducing the simulation.
- [Question](./subpages/Question.jsx) when the user is in a question/scenario of the simulation.
- [EndPage](./subpages/EndPage.jsx) at the end, showing the user he/she is done.

## Further components

The above subpages make use of various general components that may be useful to include on a variety of pages. These include the following.

- [VariableOverview](./components/VariableOverview.jsx) is an overview of variables present in a simulation. It can be specified whether to show all variables (useful for the end page), or only the non-hidden ones (useful during the simulation, on question pages).

## Error handling

Whenever the simulation does an action (like processing a question choice from the user) it always first checks the simulation, like for instance the update script. If there is an error in this, the action is not executed. Instead, an error flag is turned on and the [ErrorPage](./subpages/ErrorPage.jsx) is shown. The user cannot continue.

Often this occurs when the owner is making live changes. So if the update script eventually returns to a functioning form, then the simulation is automatically placed back in its previous state (that is, the error flag is turned back down again) and the user can continue as usual. No refresh is needed.
