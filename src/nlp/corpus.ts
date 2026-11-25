import { ReasonCategory, SocialFeedPost } from '../types';

export interface LabeledSample {
  id: string;
  text: string;
  label: 0 | 1; // 1 = Toxic, 0 = Non-Toxic
  source: 'Jigsaw English' | 'Custom Tanglish';
  language: 'English' | 'Tanglish' | 'Code-Mixed';
}

export interface LexiconEntry {
  canonical: string;
  language: 'English' | 'Tanglish';
  severity: number; // 0.35 - 1.0
  category: ReasonCategory;
  gloss: string;
  variants: string[];
}

export const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'into',
  'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'we', 'our', 'he', 'him', 'his', 'she', 'her', 'and', 'or', 'but', 'if',
  'so', 'than', 'too', 'very', 'just', 'can', 'will', 'would', 'should',
  'could', 'have', 'has', 'had', 'do', 'does', 'did', 'about', 'what',
  'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
  'own', 'same', 'then', 'there', 'here', 'my', 'your', 'me', 'us',
]);

// Romanized Tamil grammatical particles & filler words (preserves toxic terms and negations)
export const TANGLISH_STOP_WORDS = new Set([
  'na', 'naa', 'la', 'le', 'nu', 'nnu', 'ku', 'kku', 'ukku', 'oda', 'udaiya',
  'inga', 'anga', 'enga', 'oru', 'rendu', 'athu', 'ithu', 'ethu', 'atha',
  'itha', 'enna', 'ena', 'yenna', 'than', 'dhaan', 'thaan', 'daan', 'laam',
  'ellam', 'ellaam', 'pola', 'maari', 'mari', 'kooda', 'kuda', 'mattum',
  'vandhu', 'vanthu', 'iruku', 'irukku', 'irukom', 'iruka', 'irukanga',
  'pannu', 'panna', 'pannitu', 'panra', 'panran', 'sollu', 'sonna', 'sonnan',
  'pa', 'ppa', 'ya', 'yya', 'di', 'dei', 'da', 'machan', 'machi', 'nanba',
  'bro', 'dude', 'yar', 'yaar', 'epdi', 'eppadi', 'apdi', 'appadi', 'ipdi',
  'romba', 'konjam', 'inga', 'ipo', 'ippo', 'appo', 'apo',
]);

export const STOP_WORDS = new Set([...ENGLISH_STOP_WORDS, ...TANGLISH_STOP_WORDS]);

export const OFFENSIVE_LEXICON: LexiconEntry[] = [
  // Tanglish abusive & cyberbullying terms
  {
    canonical: 'loosu',
    language: 'Tanglish',
    severity: 0.72,
    category: 'Tanglish Abuse',
    gloss: 'Fool / crazy person (derogatory)',
    variants: ['loosu', 'lusu', 'loosuu', 'lusoo', 'loosa', 'loosupaiyan', 'loosuponnu', 'l00su'],
  },
  {
    canonical: 'naai',
    language: 'Tanglish',
    severity: 0.78,
    category: 'Tanglish Abuse',
    gloss: 'Dog (used as a harsh personal insult)',
    variants: ['naai', 'nai', 'naaye', 'nayee', 'naayee', 'naaikku', 'naaigal', 'naye'],
  },
  {
    canonical: 'panni',
    language: 'Tanglish',
    severity: 0.76,
    category: 'Tanglish Abuse',
    gloss: 'Pig (derogatory personal slur)',
    variants: ['panni', 'panri', 'pannii', 'panniya', 'pannikku'],
  },
  {
    canonical: 'muttal',
    language: 'Tanglish',
    severity: 0.68,
    category: 'Tanglish Abuse',
    gloss: 'Idiot / stupid person',
    variants: ['muttal', 'muttaal', 'mottal', 'muttala', 'mutta'],
  },
  {
    canonical: 'kevalam',
    language: 'Tanglish',
    severity: 0.72,
    category: 'Cyberbullying',
    gloss: 'Disgraceful / pathetic / disgusting',
    variants: ['kevalam', 'kevalama', 'kevalamana', 'kevalamaanavan', 'kevalamda'],
  },
  {
    canonical: 'seruppu',
    language: 'Tanglish',
    severity: 0.85,
    category: 'Harassment / Threat',
    gloss: 'Slipper (implied threat of physical humiliation/hitting)',
    variants: ['seruppu', 'serupu', 'cheruppu', 'serupala', 'seruppala', 'serupadi'],
  },
  {
    canonical: 'kirukku',
    language: 'Tanglish',
    severity: 0.7,
    category: 'Tanglish Abuse',
    gloss: 'Lunatic / mentally unstable (insult)',
    variants: ['kirukku', 'kiruku', 'kirukka', 'kirukkan', 'kirukki'],
  },
  {
    canonical: 'erumai',
    language: 'Tanglish',
    severity: 0.72,
    category: 'Tanglish Abuse',
    gloss: 'Buffalo (fat-shaming or stupidity slur)',
    variants: ['erumai', 'eruma', 'erumamaadu', 'erumaimadu'],
  },
  {
    canonical: 'saniyan',
    language: 'Tanglish',
    severity: 0.79,
    category: 'Tanglish Abuse',
    gloss: 'Curse / wretched nuisance',
    variants: ['saniyan', 'saniyane', 'saniyaney', 'sani'],
  },
  {
    canonical: 'saavu',
    language: 'Tanglish',
    severity: 0.92,
    category: 'Harassment / Threat',
    gloss: 'Die / death wish directed at a person',
    variants: ['saavu', 'savu', 'saavuda', 'savuda', 'saavudi', 'setthupo', 'sethupo'],
  },
  {
    canonical: 'thevidiya',
    language: 'Tanglish',
    severity: 0.98,
    category: 'Profanity / Slur',
    gloss: 'Severe gendered profanity / slur',
    variants: ['thevidiya', 'thevdiya', 'thevudiya', 'thevidya', 'tvd', 'thevdiyaa'],
  },
  {
    canonical: 'punda',
    language: 'Tanglish',
    severity: 0.96,
    category: 'Profanity / Slur',
    gloss: 'Explicit Tamil vulgarity',
    variants: ['punda', 'pundai', 'pundaa', 'pundamavane'],
  },
  {
    canonical: 'oombu',
    language: 'Tanglish',
    severity: 0.94,
    category: 'Profanity / Slur',
    gloss: 'Explicit sexual profanity',
    variants: ['oombu', 'ombu', 'oombuda', 'ombuda'],
  },
  {
    canonical: 'soothu',
    language: 'Tanglish',
    severity: 0.88,
    category: 'Profanity / Slur',
    gloss: 'Vulgar anatomical profanity',
    variants: ['soothu', 'sothu', 'sootha', 'soothula'],
  },
  {
    canonical: 'baadu',
    language: 'Tanglish',
    severity: 0.86,
    category: 'Profanity / Slur',
    gloss: 'Severe derogatory street slur',
    variants: ['baadu', 'badu', 'baaduu', 'baduva'],
  },
  {
    canonical: 'arivuketta',
    language: 'Tanglish',
    severity: 0.74,
    category: 'Cyberbullying',
    gloss: 'Brainless / lacking common sense',
    variants: ['arivuketta', 'arivukettavan', 'arivilla', 'arivuilla', 'arivilladha'],
  },
  {
    canonical: 'venna',
    language: 'Tanglish',
    severity: 0.62,
    category: 'Tanglish Abuse',
    gloss: 'Useless / spineless fool',
    variants: ['venna', 'vennai', 'venney', 'vennamavane'],
  },
  {
    canonical: 'korangu',
    language: 'Tanglish',
    severity: 0.67,
    category: 'Cyberbullying',
    gloss: 'Monkey (dehumanizing body/appearance taunt)',
    variants: ['korangu', 'kurangu', 'koranga'],
  },
  {
    canonical: 'moodu',
    language: 'Tanglish',
    severity: 0.64,
    category: 'Harassment / Threat',
    gloss: 'Shut up / close your mouth aggressively',
    variants: ['moodu', 'moodra', 'vaayamoodu', 'vayamoodu', 'mooditu'],
  },
  {
    canonical: 'mokka',
    language: 'Tanglish',
    severity: 0.38,
    category: 'Tanglish Abuse',
    gloss: 'Lame / pathetic (mild insult when targeted at people)',
    variants: ['mokka', 'mokkai', 'mokkaya', 'mokkapaiyan'],
  },
  {
    canonical: 'thimiru',
    language: 'Tanglish',
    severity: 0.52,
    category: 'Tanglish Abuse',
    gloss: 'Arrogant / insolent attitude',
    variants: ['thimiru', 'thimir', 'timir', 'thimirpudicha'],
  },
  {
    canonical: 'poda',
    language: 'Tanglish',
    severity: 0.48,
    category: 'Tanglish Abuse',
    gloss: 'Get lost / dismissive command (context-sensitive)',
    variants: ['poda', 'podaa', 'podi', 'podii', 'pooda'],
  },

  // English Jigsaw-aligned toxic & cyberbullying terms
  {
    canonical: 'fuck',
    language: 'English',
    severity: 0.9,
    category: 'Profanity / Slur',
    gloss: 'Explicit English profanity / aggression',
    variants: ['fuck', 'fucking', 'fucker', 'fucked', 'fck', 'fuk', 'fvck', 'f**k', 'f*ck'],
  },
  {
    canonical: 'shit',
    language: 'English',
    severity: 0.72,
    category: 'Profanity / Slur',
    gloss: 'Profane insult or dismissal',
    variants: ['shit', 'shitty', 'bullshit', 'sh1t', 's**t'],
  },
  {
    canonical: 'bitch',
    language: 'English',
    severity: 0.88,
    category: 'Profanity / Slur',
    gloss: 'Gendered profanity / harassment slur',
    variants: ['bitch', 'bitches', 'bitching', 'b1tch', 'biatch'],
  },
  {
    canonical: 'asshole',
    language: 'English',
    severity: 0.85,
    category: 'Profanity / Slur',
    gloss: 'Vulgar personal attack',
    variants: ['asshole', 'assholes', 'a**hole', 'ashole'],
  },
  {
    canonical: 'bastard',
    language: 'English',
    severity: 0.82,
    category: 'Profanity / Slur',
    gloss: 'Harsh personal slur',
    variants: ['bastard', 'bastards', 'bstrd'],
  },
  {
    canonical: 'idiot',
    language: 'English',
    severity: 0.68,
    category: 'Cyberbullying',
    gloss: 'Intelligence-based personal attack',
    variants: ['idiot', 'idiots', 'idiotic', '1diot'],
  },
  {
    canonical: 'stupid',
    language: 'English',
    severity: 0.62,
    category: 'Cyberbullying',
    gloss: 'Derogatory attack on intelligence',
    variants: ['stupid', 'stupidity', 'st*pid', 'stoopid'],
  },
  {
    canonical: 'moron',
    language: 'English',
    severity: 0.7,
    category: 'Cyberbullying',
    gloss: 'Ableist / derogatory insult',
    variants: ['moron', 'morons', 'moronic'],
  },
  {
    canonical: 'loser',
    language: 'English',
    severity: 0.64,
    category: 'Cyberbullying',
    gloss: 'Personal humiliation / bullying',
    variants: ['loser', 'losers', 'looser', 'l0ser'],
  },
  {
    canonical: 'pathetic',
    language: 'English',
    severity: 0.62,
    category: 'Cyberbullying',
    gloss: 'Demeaning personal insult',
    variants: ['pathetic', 'pathetically'],
  },
  {
    canonical: 'worthless',
    language: 'English',
    severity: 0.82,
    category: 'Cyberbullying',
    gloss: 'Severe self-worth attack / bullying',
    variants: ['worthless', 'useless', 'garbage', 'trash', 'scum'],
  },
  {
    canonical: 'kill',
    language: 'English',
    severity: 0.95,
    category: 'Harassment / Threat',
    gloss: 'Violent threat or self-harm encouragement',
    variants: ['kill', 'kys', 'die', 'murder'],
  },
  {
    canonical: 'hate',
    language: 'English',
    severity: 0.56,
    category: 'Hate Speech',
    gloss: 'Hostility indicator (amplified in targeted contexts)',
    variants: ['hate', 'hatred', 'disgusting', 'vile'],
  },
  {
    canonical: 'racist',
    language: 'English',
    severity: 0.78,
    category: 'Hate Speech',
    gloss: 'Identity-based discrimination slur',
    variants: ['racist', 'bigot', 'nazi', 'slur'],
  },
  {
    canonical: 'shut',
    language: 'English',
    severity: 0.45,
    category: 'Harassment / Threat',
    gloss: 'Hostile silencing phrase (e.g. shut up)',
    variants: ['stfu'],
  },
  {
    canonical: 'clown',
    language: 'English',
    severity: 0.54,
    category: 'Cyberbullying',
    gloss: 'Mockery / ridicule term',
    variants: ['clown', 'clowns', 'buffoon', 'coward'],
  },
];

// General Tanglish non-toxic normalization mappings (for clean canonical output)
export const GENERAL_TANGLISH_NORMALIZATIONS: Record<string, string> = {
  nalla: 'nalla',
  nallaa: 'nalla',
  nallairuku: 'nalla',
  semma: 'semma',
  sema: 'semma',
  semmaa: 'semma',
  nandri: 'nandri',
  nanri: 'nandri',
  vaazhthukkal: 'vaazhthukkal',
  valthukkal: 'vaazhthukkal',
  kalakkal: 'kalakkal',
  kalakkita: 'kalakkal',
  supera: 'super',
  sooper: 'super',
  masss: 'mass',
  thalaiva: 'thalaiva',
  thala: 'thala',
  padam: 'padam',
  paatu: 'paatu',
  panra: 'pannu',
  panran: 'pannu',
  solringa: 'sollu',
  pesathinga: 'pesu',
  veliya: 'veliya',
  veetuku: 'veedu',
  thooki: 'thooku',
  adippen: 'adi',
  podu: 'podu',
  vada: 'vaa',
  vaada: 'vaa',
  illai: 'illa',
  illa: 'illa',
  ille: 'illa',
  vendaam: 'venda',
  vendam: 'venda',
  venda: 'venda',
  ponga: 'po',
  poda: 'poda',
  podaa: 'poda',
};

export const TANGLISH_NORMALIZATION_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = { ...GENERAL_TANGLISH_NORMALIZATIONS };
  for (const entry of OFFENSIVE_LEXICON) {
    for (const v of entry.variants) {
      map[v] = entry.canonical;
    }
  }
  return map;
})();

export const VARIANT_TO_LEXICON: Record<string, LexiconEntry> = (() => {
  const map: Record<string, LexiconEntry> = {};
  for (const entry of OFFENSIVE_LEXICON) {
    map[entry.canonical] = entry;
    for (const v of entry.variants) {
      map[v] = entry;
    }
  }
  return map;
})();

// Training Corpus: Jigsaw-style English + Custom Tanglish Code-Mixed comments
export const TRAIN_CORPUS: LabeledSample[] = [
  // --- English Toxic (Jigsaw-style) ---
  { id: 'tr-e1', text: 'You are a complete idiot and nobody wants your stupid opinion here.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e2', text: 'Shut up you pathetic loser, go delete your account right now.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e3', text: 'This is total bullshit, you are an absolute moron who knows nothing.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e4', text: 'What a worthless piece of trash, people like you are scum.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e5', text: 'I hate your disgusting face, stop posting garbage you clown.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e6', text: 'Go die somewhere else you bastard, nobody cares about you.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e7', text: 'Stop acting like a bitch and admit you are a coward.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e8', text: 'You are so fucking stupid it hurts to read your comments.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e9', text: 'What an asshole move, you deserve to be kicked off this platform.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e10', text: 'Get lost you brainless buffoon, your work is utter garbage.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e11', text: 'Kill yourself honestly, the world would be better without your nonsense.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e12', text: 'You racist bigot, crawl back into whatever hole you came from.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e13', text: 'Stfu already, nobody asked for this idiotic rant from a loser.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e14', text: 'F*ck off with this shitty take, you are completely useless.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e15', text: 'Every single video you upload is pathetic trash made by a moron.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e16', text: 'You are an embarrassment to your family, worthless idiot.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e17', text: 'Disgusting vile human being, I hope someone beats you up.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e18', text: 'Nobody likes you, stop begging for attention you pathetic loser.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e19', text: 'Your logic is completely idiotic and you sound like a fool.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e20', text: 'Why do assholes like you always ruin every comment section?', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e21', text: 'You are a lying scumbag and a total waste of space.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-e22', text: 'Shut your filthy mouth before someone shuts it for you.', label: 1, source: 'Jigsaw English', language: 'English' },

  // --- English Non-Toxic (Jigsaw-style) ---
  { id: 'tr-s1', text: 'Thank you for sharing this detailed breakdown, it really helped clarify the topic.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s2', text: 'I respectfully disagree with your conclusion, though your research data is solid.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s3', text: 'Great explanation! Could you share the source code repository as well?', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s4', text: 'The editing in the second half felt a bit rushed, otherwise a solid tutorial.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s5', text: 'Congratulations on launching the new release, looking forward to trying it out.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s6', text: 'Can someone confirm whether this dataset supports multi-label evaluation?', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s7', text: 'I think there is a small bug in line 42 when handling empty strings.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s8', text: 'What an inspiring journey, wishing the entire team continued success.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s9', text: 'This policy has pros and cons, let us discuss both sides calmly.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s10', text: 'Audio quality improved a lot compared to last week, nice job.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s11', text: 'Please cite the benchmark paper so readers can verify the accuracy numbers.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s12', text: 'I struggled with this concept too until I practiced with smaller examples.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s13', text: 'Not my favorite genre, but I appreciate the effort put into the soundtrack.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s14', text: 'Could we schedule a review session tomorrow morning to finalize the notes?', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s15', text: 'Really insightful perspective on online safety and community moderation.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s16', text: 'I used to hate debugging CSS grids, now Flexbox and Grid make sense.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s17', text: 'Hope everyone stays safe during the heavy rains tonight.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s18', text: 'Good match today, both teams played with tremendous discipline.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s19', text: 'The baseline logistic regression model already achieves strong precision.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s20', text: 'Thanks for moderating the discussion fairly and keeping it constructive.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s21', text: 'I dislike the ending of the movie, it felt predictable.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'tr-s22', text: 'Welcome to the forum! Feel free to ask questions anytime.', label: 0, source: 'Jigsaw English', language: 'English' },

  // --- Custom Tanglish & Code-Mixed Toxic ---
  { id: 'tr-t1', text: 'Poda loosu naai, unaku arivu illaya da muttal.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t2', text: 'Kevalama pesadha da panni, seruppu thooki adippen.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t3', text: 'Nee ellam oru manushan ah? Saavu da saniyan.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t4', text: 'Un moonja paaru eruma maadu maari, veliya poda korangu.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t5', text: 'Vaaya moodra kirukku paiyan, romba thimiru unaku.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t6', text: 'Indha loosu ponnu comment section la vanthu kevalam panra.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t7', text: 'Dai arivuketta muttal, unaku konjam kooda buddhi illa.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t8', text: 'Total waste fellow da nee, venna maari pesிட்டு iruka.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t9', text: 'Thevidiya paiya, unna mathiri naai ellam inga vara koodathu.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t10', text: 'Seruppala adippen da baadu, mooditu veliya po.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-t11', text: 'Oombu da punda, un opinion yaarum kekala.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t12', text: 'Sootha mooditu poda loosu, daily vanthu irritate panra.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t13', text: 'Enna da kevalamana post idhu, stupid panni mathiri pesadha.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t14', text: 'You are a complete loosu and muttal, stop posting trash da.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t15', text: 'Kirukku naai ellam phone use panna ipdi than irukum.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t16', text: 'Saniyan pudicha idiot, unaku vera vela illaya?', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t17', text: 'Poda dei mokka fellow, nee oru worthless clown.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t18', text: 'Erumai maari okkanthutu comment podadha da loser.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t19', text: 'Thimiru pudicha naaye, unna block pannanum.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t20', text: 'Chee kevalam, ivan ellam uyiroda irukuraதே waste.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t21', text: 'L00su paiya shut up and get lost from this channel.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t22', text: 'Saavuda muttal, un face paathale kadupu aaguthu.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t23', text: 'Panni moonja paaru, acting like an expert idiot.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-t24', text: 'Unaku seruppu adi than saripattum da baadu.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },

  // --- Custom Tanglish & Code-Mixed Non-Toxic ---
  { id: 'tr-ts1', text: 'Semma video bro, romba nalla explain pannirukinga!', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts2', text: 'Nandri nanba, indha tutorial romba useful ah iruku.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts3', text: 'Super editing machan, kalakkal performance!', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts4', text: 'Inniki match semma mass ah irundhuchu, thalaiva vaazhthukkal!', label: 0, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'tr-ts5', text: 'Anna konjam audio volume increase panna nalla irukum.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts6', text: 'Indha padam second half konjam slow ah iruku but music super.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts7', text: 'Enaku idhu puriyala bro, innoru vaati clear ah solringala?', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts8', text: 'Poda dei awesome shot adhu, sema entertainment today!', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts9', text: 'Chennai climate ippo romba pleasant ah iruku evening time la.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts10', text: 'Ungaloda hard work kandippa success aagum nanba, keep going.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts11', text: 'Project presentation nalla mudinjiduchu, thanks team!', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts12', text: 'Paatu lyrics romba meaningful ah iruku, repeat mode la kekuren.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts13', text: 'Indha code snippet use panni bug fix panniten, romba nandri.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts14', text: 'Machi exam eppadi eluthuna? Nalla score varum nu namburen.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts15', text: 'Intha weekend Trichy poren, nalla hotel suggest pannunga friends.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts16', text: 'Comedy scene konjam mokka ah irundhalum overall film nalla iruku.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts17', text: 'Akka unga recipe try panninen, veetla ellarukum romba pudichiruku.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts18', text: 'Cricket score enna aachu? Last over romba thrilling ah poguthu.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts19', text: 'Dataset cleaning pathi oru video podunga bro, helpful ah irukum.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts20', text: 'Nalla முயற்சி, இன்னும் கொஞ்சம் details add panna super ah irukum.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts21', text: 'Happy Diwali nanba, safe ah celebrate pannunga!', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts22', text: 'Indha topic pathi clean explanation kuduthathuku nandri.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts23', text: 'Bro next part eppo upload pannuvinga? Waiting eagerly.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'tr-ts24', text: 'Valuable feedback, naanga kandippa next update la fix panrom.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
];

// Held-out evaluation split for benchmark metrics & confusion matrices
export const TEST_CORPUS: LabeledSample[] = [
  // English Test Toxic
  { id: 'te-1', text: 'You are such an idiot, stop embarrassing yourself with this garbage.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'te-2', text: 'Shut up loser, nobody wants to hear your pathetic excuses.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'te-3', text: 'Go fuck yourself you worthless asshole.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'te-4', text: 'What a stupid moron, total waste of oxygen.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'te-5', text: 'Disgusting racist scum, get off the internet.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'te-6', text: 'Bitch please, you are a complete coward and a clown.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'te-7', text: 'I hope you die alone you miserable bastard.', label: 1, source: 'Jigsaw English', language: 'English' },
  { id: 'te-8', text: 'Stfu with your idiotic bullshit takes.', label: 1, source: 'Jigsaw English', language: 'English' },

  // English Test Non-Toxic
  { id: 'te-9', text: 'This documentation is clear and helped our team integrate the API quickly.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'te-10', text: 'I disagree with the third point, could you share more benchmark figures?', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'te-11', text: 'Nice summary of TF-IDF weighting and linear margin classifiers.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'te-12', text: 'Great effort by the volunteers organizing the community cleanup.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'te-13', text: 'Looking forward to reading the next chapter of this series.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'te-14', text: 'Could you please verify if the CSV export handles Unicode Tamil text?', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'te-15', text: 'The design looks clean and easy to navigate on desktop.', label: 0, source: 'Jigsaw English', language: 'English' },
  { id: 'te-16', text: 'Thank you for responding promptly to my bug report.', label: 0, source: 'Jigsaw English', language: 'English' },

  // Tanglish Test Toxic
  { id: 'te-17', text: 'Poda loosu naai, unaku konjam kooda arivu illaya?', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'te-18', text: 'Kevalama comment podadha da panni, seruppu adippen.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-19', text: 'Kirukku muttal mathiri pesitu iruka, vaaya moodra.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'te-20', text: 'Saavu da saniyan, nee ellam useless garbage.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-21', text: 'Thevidiya paiya, unna mathiri baadu inga theva illa.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'te-22', text: 'Erumai maadu maari behave panra da arivuketta idiot.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-23', text: 'Sootha mooditu veliya po da venna.', label: 1, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'te-24', text: 'Korangu moonji, romba thimiru unaku loser.', label: 1, source: 'Custom Tanglish', language: 'Code-Mixed' },

  // Tanglish Test Non-Toxic
  { id: 'te-25', text: 'Semma explanation bro, Tanglish comments ku romba useful ah iruku!', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-26', text: 'Nandri machan, unga support ku romba thanks.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-27', text: 'Nalla try nanba, next time innum super ah varum.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-28', text: 'Inniki class romba interesting ah irundhuchu, thanks maam.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-29', text: 'Poda dei sema goal adhu, match kalakkal!', label: 0, source: 'Custom Tanglish', language: 'Tanglish' },
  { id: 'te-30', text: 'Anna indha app UI romba neat ah iruku, vaazhthukkal.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-31', text: 'Konjam delay aanaalum quality super ah vandhuruku.', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
  { id: 'te-32', text: 'Friends ellarukum good morning, have a great day!', label: 0, source: 'Custom Tanglish', language: 'Code-Mixed' },
];

export const SAMPLE_COMMENTS: Array<{ label: string; language: string; text: string }> = [
  {
    label: 'Tanglish Cyberbullying',
    language: 'Tanglish',
    text: 'Poda loosu naai, unaku konjam kooda arivu illaya? Kevalama comment podadha da panni!',
  },
  {
    label: 'Code-Mixed Threat',
    language: 'Code-Mixed',
    text: 'Vaaya moodra kirukku idiot, innoru vaati pesina seruppu thooki adippen da loser.',
  },
  {
    label: 'Obfuscated Profanity',
    language: 'Code-Mixed',
    text: 'Stop acting like a l00su clown, this f*cking post is total garbage da muttal.',
  },
  {
    label: 'Friendly Tanglish Banter (Safe)',
    language: 'Tanglish',
    text: 'Poda dei sema sixer adhu! Match romba mass ah irundhuchu nanba, vaazhthukkal!',
  },
  {
    label: 'English Toxic (Jigsaw)',
    language: 'English',
    text: 'You are a pathetic moron and a worthless coward. Shut up and delete your account.',
  },
  {
    label: 'Constructive Feedback (Safe)',
    language: 'Code-Mixed',
    text: 'Semma tutorial bro! Konjam audio clarity increase panna innum nalla irukum, nandri.',
  },
];

export const INITIAL_SOCIAL_POSTS: SocialFeedPost[] = [
  {
    id: 'post-1',
    authorHandle: '@aravind_dev',
    authorName: 'Aravind Karthik',
    timestampLabel: '12m ago',
    topic: 'Campus Tech Forum',
    text: 'Semma session today on NLP pipelines! Could someone share the Tanglish normalization word list used in the lab?',
    likes: 24,
  },
  {
    id: 'post-2',
    authorHandle: '@anon_troll99',
    authorName: 'Unknown Account',
    timestampLabel: '9m ago',
    topic: 'Campus Tech Forum',
    text: 'Poda loosu naai, unaku coding theriyala na vaaya mooditu po da muttal. Total worthless trash.',
    likes: 0,
  },
  {
    id: 'post-3',
    authorHandle: '@priya_chennai',
    authorName: 'Priya Sundaram',
    timestampLabel: '7m ago',
    topic: 'Chennai Cinema Thread',
    text: 'First half konjam slow ah irundhalum background score romba nalla iruku. Worth watching with family!',
    likes: 18,
  },
  {
    id: 'post-4',
    authorHandle: '@toxic_burner04',
    authorName: 'Burner Profile',
    timestampLabel: '4m ago',
    topic: 'Chennai Cinema Thread',
    text: 'Kevalama review podadha da panni, un moonja paaru eruma maadu maari. Seruppala adippen.',
    likes: 1,
  },
  {
    id: 'post-5',
    authorHandle: '@vikram_ml',
    authorName: 'Vikram Narayanan',
    timestampLabel: '2m ago',
    topic: 'Open Source Discussions',
    text: 'I respectfully disagree with the SVM kernel choice here; TF-IDF with Linear SVM usually outperforms RBF on sparse text.',
    likes: 15,
  },
  {
    id: 'post-6',
    authorHandle: '@rage_baiter',
    authorName: 'Rohan_X',
    timestampLabel: '1m ago',
    topic: 'Open Source Discussions',
    text: 'You are a pathetic idiot and a complete loser. Stfu and stop posting garbage.',
    likes: 0,
  },
];
