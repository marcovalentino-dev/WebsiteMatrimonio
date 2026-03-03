import { z } from 'zod';

const sectionEnum = z.enum(['story', 'details', 'maps', 'dressCode', 'faq', 'gallery', 'rsvp', 'guestbook']);

export const SiteConfigSchema = z.object({
  event: z.object({
    coupleNames: z.string().min(1),
    dateISO: z.string().min(1),
    timezone: z.string().min(1),
    dressCode: z.string().min(1),
    notes: z.string(),
    ceremony: z.object({
      name: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      time: z.string().min(1)
    }),
    reception: z.object({
      name: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      time: z.string().min(1)
    })
  }),
  theme: z.object({
    palette: z.object({
      primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
      secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
      background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
      surface: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
      text: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    }),
    fontPairing: z.object({
      heading: z.enum(['playfair', 'cormorant', 'prata']),
      body: z.enum(['manrope', 'nunito', 'montserrat'])
    }),
    radius: z.number().min(4).max(32),
    shadowIntensity: z.number().min(0).max(100),
    backgroundStyle: z.enum(['gradient', 'soft-noise', 'minimal'])
  }),
  introLetter: z.object({
    enabled: z.boolean(),
    envelopeStyle: z.enum(['ivory', 'rose', 'midnight']),
    sealStyle: z.string().min(1).max(4),
    introText: z.string().min(1).max(180),
    playSound: z.boolean(),
    animationVariant: z.enum(['classic', 'smooth'])
  }),
  sections: z.object({
    enabledMap: z.object({
      story: z.boolean(),
      details: z.boolean(),
      maps: z.boolean(),
      dressCode: z.boolean(),
      faq: z.boolean(),
      gallery: z.boolean(),
      rsvp: z.boolean(),
      guestbook: z.boolean()
    }),
    order: z.array(sectionEnum).length(8),
    countdownEnabled: z.boolean()
  }),
  rsvp: z.object({
    enabled: z.boolean(),
    deadlineISO: z.string().min(1),
    fields: z.object({
      name: z.boolean(),
      plusOneCount: z.boolean(),
      allergies: z.boolean(),
      message: z.boolean()
    }),
    submitMode: z.enum(['mailto', 'copyToClipboard']),
    recipientEmail: z.string().email()
  }),
  gallery: z.object({
    enabled: z.boolean(),
    layout: z.enum(['grid', 'masonry', 'slider']),
    images: z.array(z.string().url()).min(1),
    allowGuestUploadLink: z.string().url().optional().or(z.literal(''))
  }),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    ogImageUrl: z.string().url()
  }),
  privacy: z.object({
    showCookieBanner: z.boolean(),
    rsvpDisclaimerText: z.string().min(1)
  }),
  texts: z.object({
    heroSubtitle: z.string().min(1),
    storyTitle: z.string().min(1),
    storyBody: z.string().min(1),
    detailsTitle: z.string().min(1),
    faqItems: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).min(1),
    footerNote: z.string().min(1)
  })
});

export type SiteConfigInput = z.infer<typeof SiteConfigSchema>;
