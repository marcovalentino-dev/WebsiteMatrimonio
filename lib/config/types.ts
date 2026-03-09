export type SectionKey =
  | 'story'
  | 'details'
  | 'maps'
  | 'dressCode'
  | 'faq'
  | 'gallery'
  | 'rsvp'
  | 'guestbook';

export interface SiteConfig {
  event: {
    coupleNames: string;
    dateISO: string;
    timezone: string;
    dressCode: string;
    notes: string;
    ceremony: { name: string; address: string; city: string; time: string };
    reception: { name: string; address: string; city: string; time: string };
  };
  theme: {
    palette: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
    };
    fontPairing: {
      heading: 'playfair' | 'cormorant' | 'prata' | 'lucida-handwriting' | 'segoe-script' | 'lucida-calligraphy';
      body: 'manrope' | 'nunito' | 'montserrat';
    };
    radius: number;
    shadowIntensity: number;
    backgroundStyle: 'gradient' | 'soft-noise' | 'minimal';
  };
  introLetter: {
    enabled: boolean;
    envelopeStyle: 'ivory' | 'rose' | 'midnight';
    sealStyle: string;
    introText: string;
    playSound: boolean;
    animationVariant: 'classic' | 'smooth';
  };
  sections: {
    enabledMap: Record<SectionKey, boolean>;
    order: SectionKey[];
    countdownEnabled: boolean;
  };
  rsvp: {
    enabled: boolean;
    deadlineISO: string;
    fields: {
      name: boolean;
      plusOneCount: boolean;
      allergies: boolean;
      message: boolean;
    };
    submitMode: 'mailto' | 'copyToClipboard';
    recipientEmail: string;
  };
  gallery: {
    enabled: boolean;
    layout: 'grid' | 'masonry' | 'slider';
    images: string[];
    allowGuestUploadLink?: string;
  };
  seo: {
    title: string;
    description: string;
    ogImageUrl: string;
  };
  privacy: {
    showCookieBanner: boolean;
    rsvpDisclaimerText: string;
  };
  texts: {
    heroSubtitle: string;
    storyTitle: string;
    storyBody: string;
    detailsTitle: string;
    receptionDescription: string;
    receptionParkingNote: string;
    faqItems: Array<{ q: string; a: string }>;
    footerNote: string;
  };
}
