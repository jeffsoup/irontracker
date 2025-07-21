import { Builder } from "@builder.io/react";
import BuilderPage from "./components/BuilderPage";
import Counter from "./components/Counter/Counter";
import { ExerciseForm } from "./components/ExerciseForm";
import { ExerciseList } from "./components/ExerciseList";
import { ExerciseTabs } from "./components/ExerciseTabs";
import { WorkoutDialog } from "./components/WorkoutDialog";
import { WorkoutsList } from "./components/WorkoutsList";

Builder.registerComponent(Counter, {
  name: "Counter",
  inputs: [
    {
      name: "initialCount",
      type: "number",
    },
  ],
});

Builder.registerComponent(ExerciseTabs, {
  name: "ExerciseTabs",
  hideFromInsertMenu: false,
  inputs: [
    {
      name: "activeWorkout",
      type: "object",
      helperText: "The currently active workout (or null)",
      defaultValue: null,
    },
    {
      name: "onDelete",
      type: "function",
      helperText: "Function to call to delete an exercise by id",
    },
    {
      name: "onShowSnackbar",
      type: "function",
      helperText: "Function to show a snackbar message",
    },
    {
      name: "setActiveWorkout",
      type: "function",
      helperText: "Function to set the active workout",
      required: false,
    },
  ],
});

Builder.registerComponent(ExerciseList, {
  name: "ExerciseList",
  hideFromInsertMenu: false,
  inputs: [
    {
      name: "activeWorkout",
      type: "object",
      helperText: "The currently active workout (or null)",
      defaultValue: null,
    },
    {
      name: "onDelete",
      type: "function",
      helperText: "Function to call to delete an exercise by id",
    },
    {
      name: "onShowSnackbar",
      type: "function",
      helperText: "Function to show a snackbar message",
    },
    {
      name: "setActiveWorkout",
      type: "function",
      helperText: "Function to set the active workout",
      required: false,
    },
  ],
});

Builder.registerComponent(WorkoutsList, {
  name: "WorkoutsList",
  hideFromInsertMenu: false,
  inputs: [
    {
      name: "activeWorkout",
      type: "object",
      helperText: "The currently active workout (or null)",
      defaultValue: null,
    },
    {
      name: "onResume",
      type: "function",
      helperText: "Function to call to resume a workout",
    },
    {
      name: "onDelete",
      type: "function",
      helperText: "Function to call to delete a workout by id",
    },
  ],
});

Builder.registerComponent(ExerciseForm, {
  name: "ExerciseForm",
  hideFromInsertMenu: false,
  inputs: [
    {
      name: "activeWorkout",
      type: "object",
      helperText: "The currently active workout (or null)",
      defaultValue: null,
    },
    {
      name: "onSubmit",
      type: "function",
      helperText: "Function to call when the form is submitted",
    },
  ],
});

Builder.registerComponent(WorkoutDialog, {
  name: "WorkoutDialog",
  hideFromInsertMenu: false,
  inputs: [
    {
      name: "open",
      type: "boolean",
      helperText: "Whether the dialog is open",
      defaultValue: false,
    },
    {
      name: "onClose",
      type: "function",
      helperText: "Function to call to close the dialog",
    },
    {
      name: "onStart",
      type: "function",
      helperText:
        "Function to call to start a workout with selected categories",
    },
  ],
});

Builder.registerComponent(BuilderPage, {
  name: "BuilderPage",
});
