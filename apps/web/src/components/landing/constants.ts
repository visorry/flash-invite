export interface Feature {
  id: string;
  title: string;
  description: string;
  colSpan?: number;
}

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const ASSETS = {
  DASHBOARD: "/assets/dashboard-preview.png",
  HERO_BG: "/hero-bg.avif",
  GRADIENT_BOTTOM: "/hero-bg.png",
};

export const FEATURES: Feature[] = [
  {
    id: '1',
    title: "Create Time-Limited Invites",
    description: "Generate subscription links that automatically expire. Control access by time or plan with just a few clicks.",
    colSpan: 2
  },
  {
    id: '2',
    title: "Auto-Approve Members",
    description: "Automatically approve join requests based on payment status. No manual work required.",
    colSpan: 1
  },
  {
    id: '3',
    title: "Manage Multiple Groups",
    description: "Control all your Telegram groups and channels from a single dashboard.",
    colSpan: 1
  },
  {
    id: '4',
    title: "Track & Analyze",
    description: "Get insights into member activity, subscription status, and revenue with detailed analytics.",
    colSpan: 2
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote: "\"Flash Invite transformed how I manage my paid community. The automation saves me hours every week.\"",
    authorName: "Alex Chen",
    authorRole: "Community Manager",
  },
  {
    id: 't2',
    quote: "\"Finally, a tool that handles Telegram subscriptions properly. My members love the seamless experience.\"",
    authorName: "Sarah Miller",
    authorRole: "Course Creator",
  },
  {
    id: 't3',
    quote: "\"The time-limited invites feature is a game changer. No more manual tracking of who should have access.\"",
    authorName: "David Park",
    authorRole: "Trading Group Owner",
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'q1',
    question: "What is Flash Invite?",
    answer: "Flash Invite is a Telegram bot management platform that helps you automate group access, create time-limited invites, and manage paid communities effortlessly."
  },
  {
    id: 'q2',
    question: "How does the auto-approve feature work?",
    answer: "Once a member pays for access, Flash Invite automatically approves their join request to your Telegram group or channel. No manual intervention needed."
  },
  {
    id: 'q3',
    question: "Can I manage multiple groups?",
    answer: "Yes! You can manage multiple Telegram groups and channels from a single dashboard, each with their own access rules and pricing."
  },
  {
    id: 'q4',
    question: "What payment methods are supported?",
    answer: "We support various payment methods through our payment processor, including credit cards and popular digital payment options."
  },
  {
    id: 'q5',
    question: "Is there a free trial?",
    answer: "Yes! You can get started for free and explore the platform before committing to a paid plan."
  }
];
