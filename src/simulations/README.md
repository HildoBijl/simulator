# Simulation reading/writing

This folder concerns itself with providing functions and hooks for easy reading/writing of simulation properties. 

## External usage

The most crucial function for external use is the `useSimulation` hook. You use it through

```
function SomeReactComponent({ simulationId }) {
	const simulation = useSimulation(simulationId)
	// Render something with the simulation.
}
```

This gives you the simulation as one big object. Behind the scenes it loads in all relevant data, including questions, variables and events. And if any part of the simulation is changed (like when the creator adjusts it) then the component is immediately rerended. (To prevent this, and only load the simulation once, add `true` as second parameter to `useSimulation(id, true)`. Although usually this live updating is very much desired.)

## Internal functionalities

This folder has a large variety of functions and hooks related to simulations.

- [functions](./functions.js) are things that only run once. Think of `getSimulation` or `updateSimulation`. They can be read and/or write.
- [hooks](./hooks.js) are useful in React components to load certain data and automatically get updates on changes. Think of `useSimulation` described above. Hooks generally only read stuff.

Hooks sometimes use functions, but functions never use hooks.

This split of code into functions and hooks holds for the fundamental simulation properties (like title, description, etcetera). It separately also is applied to more extended functionalities, like [questions](./questions/), [variables](./variables/) and [events](./events/).
