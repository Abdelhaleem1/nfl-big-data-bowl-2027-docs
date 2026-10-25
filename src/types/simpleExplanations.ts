export const SIMPLE_DATASET_EXPLANATIONS: Record<string, string> = {
  'players.csv':
    'Think of this as the player ID card table. Each row is one football player, showing their name, height, weight, college, and field position.',
  'games.csv':
    'A schedule and scoreboard list of NFL games. Each row is one game, showing the date, season year, home team, away team, and final score.',
  'combine_results.csv':
    'Before college players enter the NFL, they attend a "job interview" workout called the Scouting Combine. This file records their stopwatch times and jump scores (like how fast they run 40 yards or how high they jump).',
  'combine_tracking.csv':
    'During those pre-NFL Combine workouts, players wear a sensor chip that records their exact location and speed 10 times every second. Instead of just the final stopwatch time, this shows every step, turn, and burst of speed.',
  'player_career_successes.csv':
    'This shows how well players actually performed once they reached the NFL. It helps answer whether players who moved well in pre-NFL workouts became successful NFL players.',
  'player_play.csv':
    'In football, a game is made up of individual action moments called "plays." Each row here tells you what a specific player did on a specific play (for example, which path they ran or whether they caught the ball).',
  'game_tracking_2023.csv':
    'Sensor data from real 2023 NFL season games. It records every player’s exact position, speed, and direction 10 times per second during live game plays.',
  'game_tracking_2024.csv':
    'Sensor data from real 2024 NFL season games, capturing every player’s location, speed, and movement 10 times per second.',
  'game_tracking_2025.csv':
    'Sensor data from real 2025 NFL season games, capturing every player’s location, speed, and movement 10 times per second.',
};

export interface BeginnerTerm {
  term: string;
  group: 'Football Basics' | 'Player Positions' | 'Workout Drills' | 'Sensor & Data Terms';
  simple_explanation: string;
  real_world_analogy: string;
}

export const BEGINNER_NFL_GUIDE: BeginnerTerm[] = [
  {
    term: 'NFL (National Football League)',
    group: 'Football Basics',
    simple_explanation:
      'The top professional American football league in the United States, made up of 32 teams.',
    real_world_analogy: 'Like the Premier League in soccer or the NBA in basketball.',
  },
  {
    term: 'The Draft & "Prospects"',
    group: 'Football Basics',
    simple_explanation:
      'Every year, top university (college) players apply to join the NFL. These applicants are called "prospects," and teams take turns picking them in an event called the NFL Draft.',
    real_world_analogy: 'Like companies recruiting top university graduates once a year.',
  },
  {
    term: 'NFL Scouting Combine',
    group: 'Football Basics',
    simple_explanation:
      'A 1-week physical testing event held before the Draft where college players run sprints, jump, and do agility drills in front of NFL coaches and scouts.',
    real_world_analogy:
      'A standardized physical exam and fitness test before a team decides who to hire.',
  },
  {
    term: 'A "Play" & "Ball Snap"',
    group: 'Football Basics',
    simple_explanation:
      'Unlike soccer where play is continuous, American football is broken into short 5-second bursts of action called "plays." Every play starts with the "snap" (when the ball is handed/thrown backward to start the action).',
    real_world_analogy: 'Like a single point/rally in tennis or volleyball.',
  },
  {
    term: 'Line of Scrimmage',
    group: 'Football Basics',
    simple_explanation:
      'The imaginary line across the field where the ball sits before a play starts. Both teams line up facing each other on opposite sides of this line.',
    real_world_analogy: 'The starting line where both teams face off before the whistle.',
  },
  {
    term: 'Route (Running a Route)',
    group: 'Football Basics',
    simple_explanation:
      'A planned path that an attacking player runs (for example, sprint 10 yards forward, then make a sharp 90-degree turn to the sideline) to get open and catch a pass.',
    real_world_analogy: 'A choreographed sprint path designed to shake off a defender.',
  },
  {
    term: 'WR — Wide Receiver',
    group: 'Player Positions',
    simple_explanation:
      'Fast, agile players who line up near the edges of the field. Their main job is to sprint downfield, make sharp turns, and catch passes.',
    real_world_analogy: 'Like a fast winger in soccer whose job is to outrun defenders.',
  },
  {
    term: 'TE — Tight End',
    group: 'Player Positions',
    simple_explanation:
      'A hybrid player who is both big enough to block defenders and fast enough to run routes and catch passes.',
    real_world_analogy: 'An all-rounder who combines strength and catching ability.',
  },
  {
    term: 'DB — Defensive Back (Cornerbacks & Safeties)',
    group: 'Player Positions',
    simple_explanation:
      'Fast defensive players whose job is to shadow Wide Receivers and Tight Ends, running backward and turning quickly to stop them from catching passes.',
    real_world_analogy: 'A one-on-one defender guarding the opposing team’s fastest scorer.',
  },
  {
    term: 'OL — Offensive Linemen',
    group: 'Player Positions',
    simple_explanation:
      'The largest players on offense (often 300+ lbs) who stand in the middle and act as a human shield to protect the thrower (Quarterback) and clear paths for runners.',
    real_world_analogy: 'Bodyguards protecting the player with the ball.',
  },
  {
    term: 'DL — Defensive Linemen',
    group: 'Player Positions',
    simple_explanation:
      'Powerful, explosive defenders who line up directly across from the Offensive Linemen and try to burst past them to tackle the ball carrier.',
    real_world_analogy: 'Wrecking balls trying to break through the protective wall in under 2 seconds.',
  },
  {
    term: '40-Yard Dash & 10-Yard Split',
    group: 'Workout Drills',
    simple_explanation:
      'A straight 40-yard sprint (~36.5 meters). The "10-yard split" measures how fast the player covers just the first 10 yards, showing initial explosive burst.',
    real_world_analogy: 'Testing a car’s 0-to-60 mph acceleration vs. its top highway speed.',
  },
  {
    term: '3-Cone Drill & 20-Yard Short Shuttle',
    group: 'Workout Drills',
    simple_explanation:
      'Obstacle-course sprint drills where players must sprint a few yards, slam on the brakes, touch the ground, and weave tightly around cones.',
    real_world_analogy: 'Testing how well a sports car brakes and handles tight hairpin turns.',
  },
  {
    term: '10 Hz Sensor Tracking (Next Gen Stats)',
    group: 'Sensor & Data Terms',
    simple_explanation:
      'Tiny radio chips inside every player’s shoulder pads that record their exact (x, y) location, speed, and acceleration 10 times every second (every 0.1 seconds).',
    real_world_analogy: 'High-precision GPS tracking that takes 10 snapshots per second.',
  },
  {
    term: 'Orientation (o) vs. Direction (dir)',
    group: 'Sensor & Data Terms',
    simple_explanation:
      '"Orientation" is the direction a player’s chest is facing (0–360°), while "Direction" is the angle their body is actually moving. When a defender runs backward, they face one way while moving the opposite way.',
    real_world_analogy: 'Looking north while walking backward toward the south.',
  },
];
