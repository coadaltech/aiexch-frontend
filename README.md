# AIEXCH - Gaming Exchange Platform

A modern, responsive gaming exchange platform built with Next.js, featuring casino games, sports betting, and live casino experiences.

## Features

### 🎮 Gaming Sections
- **Casino Games** - Slots, table games, and classic casino experiences
- **Sports Betting** - Live sports events with real-time odds
- **Live Casino** - Real dealers with interactive gaming tables

### 👤 User Management
- **Profile Management** - Personal information and account settings
- **KYC Verification** - Document upload and identity verification
- **Transaction History** - Deposits, withdrawals, and bet tracking
- **Bonus System** - Promotions and reward management

### 📱 Responsive Design
- **Desktop Navigation** - Organized sidebar with grouped sections
- **Mobile Navigation** - Bottom tabs with "More" menu for additional pages
- **Adaptive Layout** - Optimized for all screen sizes

### 🎨 Design System
- **Typography** - Poppins for body text, Cinzel for headings
- **Color Scheme** - Casino-themed dark mode with gold accents
- **Components** - Reusable UI components with consistent styling

## Pages

### Main Sections
- `/` - Homepage with featured games and promotions
- `/casino` - Casino games grid
- `/sports` - Sports betting events
- `/live-casino` - Live dealer tables
- `/promotions` - Current offers and bonuses

### User Account
- `/profile` - User dashboard
- `/profile/personal-info` - Account information
- `/profile/transaction-history` - Financial records
- `/profile/bet-history` - Gaming history
- `/profile/bonus` - Bonus management
- `/kyc` - Identity verification

### Information Pages
- `/faqs` - Frequently asked questions
- `/game-rules` - Gaming rules and guidelines
- `/terms` - Terms and conditions
- `/privacy` - Privacy policy
- `/responsible-gaming` - Responsible gaming information
- `/white-labeling` - White label solutions
- `/live-support` - Customer support

## Tech Stack

- **Framework** - Next.js 15
- **Styling** - Tailwind CSS
- **UI Components** - Radix UI
- **Icons** - Lucide React
- **Fonts** - Google Fonts (Poppins, Cinzel)
- **TypeScript** - Full type safety

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aiexch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/
│   ├── (main)/           # Main application routes
│   │   ├── casino/       # Casino games
│   │   ├── sports/       # Sports betting
│   │   ├── live-casino/  # Live dealer games
│   │   ├── profile/      # User account pages
│   │   └── kyc/          # KYC verification
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Navigation components
│   └── modals/           # Modal components
└── public/               # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.