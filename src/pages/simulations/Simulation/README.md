# Simulation running

This is where all the functionalities for running a simulation preside.

## Simulation logic

The logic for the simulation - what should happen when a user does something - is in the [actions](./actions.js) file. This file returns a set of actions like `start`, `chooseOption`, `goToNextPage`. Each action updates the history/state accordingly. This history is important, so let's specify how it works.

The idea is that, during the simulation, we track a list of pages. The resulting array has the following form.

```
history = [{
	pageId: 'pageIdFromDatabase',
	variablesBefore: { 'variableIdFromDatabase1': 0, variableIdFromDatabase2': 100 },
	choice: 2,
	variablesAfter: { 'variableIdFromDatabase1': 3, variableIdFromDatabase2': 80 },
}, ...]
```

Note that variables are stored per state both before a choice is made (yet after the page entry script) and after the choice is made (after the page/option update script). In case of a page without any answer options, no choice is stored. Also, in case of events, various other parameters may be stored to handle the event sequence properly.

Whenever a page is rendered, always the last entry of the `history` (known as the `state`) is used. If a choice is made, the `variablesAfter` parameter is used. Otherwise the `variablesBefore` parameter is shown.

## General rendering

The [Simulation](./Simulation.jsx) file is the main component that is rendered. It pulls the ID from the URL, loads the simulation and then renders it. To do so, it uses various subpages.

- [Question](./subpages/Question.jsx) when the user is in a question/scenario of the simulation.
- [EndPage](./subpages/EndPage.jsx) at the end, showing the user he/she is done.

## Further components

The above subpages make use of various general components that may be useful to include on a variety of pages. These include the following.

- [VariableOverview](./components/VariableOverview.jsx) is an overview of variables present in a simulation. It can be specified whether to show all variables (useful for the end page), or only the non-hidden ones (useful during the simulation, on question pages).

## Error handling

There are two types of errors that can occur in the simulation: errors that can be avoided for now or instant crash errors.

If the user is at a `pageId` that is unknown (for instance because the creator removed that page) then the simulation cannot be run. This is an instant crash and, as soon as it is detected, the [ErrorPage](./subpages/ErrorPage.jsx) is shown and the user needs to restart the simulation.

If, however, there is simply a faulty `updateScript`, then this is not a problem yet, until that update script needs to be run. Whenever such an error is detected, the user can still play the simulation. However, every time a script is run, that specific script is first checked for errors. If it has any, the simulation flow is stopped and an `error` flag is turned on. This causes the [ErrorPage](./subpages/ErrorPage.jsx) to be shown. It will stay that way until the simulation is fully error-free again, in which case the error-flag is turned down again. (Or the user can refresh to reset the flag, but this of course does not solve the script error.)
