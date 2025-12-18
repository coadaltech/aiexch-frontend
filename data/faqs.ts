import { FAQCategory } from "@/types";

export const faqData: FAQCategory[] = [
  {
    category: "Account & Registration",
    questions: [
      {
        question: "How do I create an account?",
        answer: "Creating an account is simple! Click the 'Sign Up' button, provide your email, create a secure password, and verify your identity. You must be 18+ to register.",
      },
      {
        question: "What documents do I need for verification?",
        answer: "You'll need a government-issued photo ID (driver's license, passport, or state ID) and a recent utility bill or bank statement for address verification.",
      },
      {
        question: "How long does account verification take?",
        answer: "Most accounts are verified within 24-48 hours. During peak times, it may take up to 72 hours. You'll receive an email confirmation once approved.",
      },
    ],
  },
  {
    category: "Deposits & Withdrawals",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept major credit cards (Visa, MasterCard), bank transfers, e-wallets (PayPal, Skrill, Neteller), and cryptocurrency (Bitcoin, Ethereum).",
      },
      {
        question: "Are there any deposit fees?",
        answer: "We don't charge deposit fees, but your payment provider may apply their own charges. Check with your bank or payment method for details.",
      },
      {
        question: "How long do withdrawals take?",
        answer: "E-wallets: 0-24 hours, Credit cards: 3-5 business days, Bank transfers: 3-7 business days, Cryptocurrency: 0-2 hours.",
      },
      {
        question: "What's the minimum withdrawal amount?",
        answer: "The minimum withdrawal is $20 for most methods. Cryptocurrency withdrawals have a $50 minimum due to network fees.",
      },
    ],
  },
  {
    category: "Games & Betting",
    questions: [
      {
        question: "Are your games fair and random?",
        answer: "Yes! All our games use certified Random Number Generators (RNG) and are regularly audited by independent testing agencies like eCOGRA.",
      },
      {
        question: "Can I play games for free?",
        answer: "Most slot games offer a demo mode where you can play with virtual credits. Table games require real money bets.",
      },
      {
        question: "What's the Return to Player (RTP) rate?",
        answer: "RTP varies by game, typically ranging from 94% to 98%. You can find each game's RTP in its information panel.",
      },
    ],
  },
  {
    category: "Bonuses & Promotions",
    questions: [
      {
        question: "How do I claim my welcome bonus?",
        answer: "Your welcome bonus is automatically credited after your first qualifying deposit. Make sure to opt-in during registration if required.",
      },
      {
        question: "What are wagering requirements?",
        answer: "Wagering requirements specify how many times you must play through bonus funds before withdrawing. For example, a 30x requirement on a $100 bonus means you must wager $3,000.",
      },
      {
        question: "Do bonuses expire?",
        answer: "Yes, most bonuses have expiration dates ranging from 7 to 30 days. Check the specific terms for each promotion.",
      },
    ],
  },
  {
    category: "Security & Responsible Gaming",
    questions: [
      {
        question: "How do you protect my personal information?",
        answer: "We use 256-bit SSL encryption, store data on secure servers, and comply with GDPR regulations. Your information is never shared with third parties.",
      },
      {
        question: "What responsible gaming tools do you offer?",
        answer: "We provide deposit limits, session time limits, cooling-off periods, and self-exclusion options. Contact support to set up these protections.",
      },
      {
        question: "How can I set spending limits?",
        answer: "Go to Account Settings > Responsible Gaming to set daily, weekly, or monthly deposit limits. Changes take 24 hours to take effect.",
      },
    ],
  },
];