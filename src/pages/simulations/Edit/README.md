# Simulation editing

This folder contains all functionalities related to rendering the Simulation editing/creating forms.

## Page set-up

The main page is the [Edit](./Edit.jsx) component. This component renders the various tabs needed to change parts of the simulation. Tabs include the following.

- [Settings](./Settings.jsx): this tab is always shown. It has the most fundamental simulation settings, like the URL, title, description, as well as the option to remove yourself as owner (or delete it when you're the last owner).
- [Questions](./questions/): this tab allows the user to add questions/scenarios to the simulation. There's the general [Questions](./questions/Questions.jsx) subpage that shows the whole overview of questions. Each individual [question](./questions/Question.jsx) has its own component, and inside that the [answer options](./questions/Options.jsx) also have their own component.
- [Variables](./variables/): this tab allows users to add variables to simulations. There is the subpage showing all [variables](./variables/Variables.jsx), and inside that each individual [variable](./variables/Variable.jsx) also has its own component.
- [Events](./events/): this tab is only shown when the simulation actually has variables. (Otherwise having events makes no sense.) There is a subpage showing all [events](./events/Events.jsx), which uses a component showing each individual [event](./events/Event.jsx).

## Change policy

Changes are generally directly applied to the database. This allows live editing of the simulation, so if the creator has a simulation open as a user on another browser tab, changes are directly visible.

There are a few exceptions to this rule. For instance, the URL of a simulation is first checked for validity before it's stored, to prevent duplicates. For these exceptions, there's an internal state inside the given text field that may differ from the value in the database. Generally though this is not the case: most input fields have values that are synchronised live from the database.
