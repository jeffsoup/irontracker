# 💪 IronTracker

A modern, feature-rich fitness tracking application built with React, TypeScript, and Supabase. Track your workouts, exercises, and progress with a beautiful, responsive interface designed for fitness enthusiasts.

![IronTracker](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.49.4-green)
![Material-UI](https://img.shields.io/badge/Material--UI-6.4.7-purple)

## ✨ Features

### 🏋️ Workout Management
- **Start/Finish Workouts**: Create structured workout sessions with multiple exercise categories
- **Category-Based Workouts**: Organize workouts by muscle groups (chest, back, legs, triceps, etc.)
- **Active Workout Tracking**: Real-time workout status with visual indicators
- **Workout History**: Complete history of all your workout sessions

### 📊 Exercise Tracking
- **Exercise Logging**: Add exercises with sets, reps, weight, and notes
- **Smart Recommendations**: Get exercise suggestions based on least recently used
- **Exercise History**: View your exercise history with filtering and search
- **Progress Tracking**: Monitor your performance over time

### 🎨 Modern UI/UX
- **Fitness-Themed Design**: Custom fitness styling with vibrant gradients and animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Material-UI Components**: Professional, accessible interface components
- **Dark Theme**: Easy on the eyes during late-night gym sessions

### 🔧 Technical Features
- **Real-time Data**: Instant updates with Supabase real-time subscriptions
- **Type Safety**: Full TypeScript implementation for better development experience
- **Authentication Ready**: Built-in user authentication system (configurable)
- **Database Views**: Optimized queries using Supabase views for better performance

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: Material-UI (MUI) with custom fitness theme
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Custom CSS with CSS custom properties
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/irontracker.git
   cd irontracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_LOGIN_REQUIRED=false
   ```

4. **Set up Supabase Database**
   - Create a new Supabase project
   - Set up the following tables:
     - `exercises` - for storing exercise data
     - `workouts` - for storing workout sessions
     - `users` - for user management
   - Create a `categories` view for exercise categories
   - Configure Row Level Security (RLS) policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
IronTracker/
├── src/
│   ├── components/          # React components
│   │   ├── ExerciseForm.tsx     # Exercise input form
│   │   ├── ExerciseList.tsx     # Exercise history display
│   │   ├── ExerciseTabs.tsx     # Tab navigation
│   │   ├── WorkoutDialog.tsx    # Workout creation dialog
│   │   └── WorkoutsList.tsx     # Workout history
│   ├── services/            # API services
│   │   ├── exerciseService.ts   # Exercise CRUD operations
│   │   └── workoutService.ts    # Workout management
│   ├── types/               # TypeScript type definitions
│   │   └── Exercise.ts          # Exercise and workout types
│   ├── styles/              # Custom CSS themes
│   │   ├── fitness-theme.css    # Main fitness theme
│   │   └── minimalist-theme.css # Alternative theme
│   ├── lib/                 # Utility libraries
│   │   └── supabase.ts          # Supabase client configuration
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🎯 Usage

### Starting a Workout
1. Click the "🚀 START WORKOUT" button
2. Select exercise categories for your workout
3. Click "Start Workout" to begin

### Adding Exercises
1. With an active workout, navigate to the exercise tab
2. Select a category from the dropdown
3. Choose an exercise name or enter a custom one
4. Add sets, reps, weight, and optional notes
5. Click "Add Exercise" to log the set

### Viewing History
- Use the exercise history tab to view all logged exercises
- Filter by date, category, exercise name, or rating
- Expand/collapse date groups for better organization

## 🔧 Configuration

### Authentication
The app supports optional authentication. To enable:
1. Set `VITE_LOGIN_REQUIRED=true` in your `.env` file
2. Uncomment the authentication code in `App.tsx`
3. Configure Supabase authentication settings

### Custom Categories
Exercise categories are managed through a Supabase view. To add new categories:
1. Access your Supabase dashboard
2. Navigate to the `categories` view
3. Add new category entries

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📦 Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** for the component library
- **Supabase** for the backend infrastructure
- **Vite** for the fast build tooling
- **React** team for the amazing framework

## 📞 Support

If you have any questions or need help with IronTracker:

- Create an issue on GitHub
- Check the documentation in the code comments
- Review the Supabase setup guide

---

**Built with 💪 by fitness enthusiasts, for fitness enthusiasts**
