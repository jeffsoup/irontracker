import { Builder } from '@builder.io/react';
import { WorkoutsList } from './WorkoutsList';
import { ExerciseTabs } from './ExerciseTabs';

Builder.registerComponent(WorkoutsList, {
  name: 'WorkoutsList',
  inputs: [
    {
      name: 'activeWorkout',
      type: 'object',
      helperText: 'The currently active workout (or null)',
      defaultValue: null,
    },
    {
      name: 'onResume',
      type: 'function',
      helperText: 'Function to call to resume a workout',
    },
    {
      name: 'onDelete',
      type: 'function',
      helperText: 'Function to call to delete a workout by id',
    },
  ],
});

Builder.registerComponent(ExerciseTabs, {
  name: 'ExerciseTabs',
  inputs: [
    {
      name: 'activeWorkout',
      type: 'object',
      helperText: 'The currently active workout (or null)',
      defaultValue: null,
    },
    {
      name: 'onDelete',
      type: 'function',
      helperText: 'Function to call to delete an exercise by id',
    },
    {
      name: 'onShowSnackbar',
      type: 'function',
      helperText: 'Function to show a snackbar message',
    },
    {
      name: 'setActiveWorkout',
      type: 'function',
      helperText: 'Function to set the active workout',
      required: false,
    },
  ],
}); 