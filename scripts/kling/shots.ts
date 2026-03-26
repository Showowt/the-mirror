/**
 * The Mirror — Complete Shot Library
 * Extracted from Cinematic Production Bible
 */

import { Shot, TextCard } from "./types";

/**
 * HERO COMMERCIAL: "THE QUESTION" (25-30s)
 * 8 shots total
 */
export const HERO_SHOTS: Shot[] = [
  {
    id: "hero-01-void",
    name: "THE VOID",
    deliverable: "hero",
    number: 1,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose:
      "Pattern interrupt. The feed is chaos. This is silence shaped like a weapon.",
    prompt: `SCENE: Pure black void. Absolute darkness, zero ambient light, no gradients, no particles. White serif text fades in from black over 0.8 seconds, centered in frame:
"I built an AI that refuses to help you."

Text is warm white on pure black. Static locked frame. No camera movement. Cinematic 9:16 vertical letterbox. The text holds motionless for 2 seconds after appearing. Ultra-minimalist. Anti-commercial aesthetic.

STYLE: A24 title card, Saul Bass minimalism, high contrast. Shot on ARRI Alexa Mini LF. Kodak Vision3 500T color science. David Fincher opening sequence aesthetic.`,
    negativePrompt:
      "particles, dust, lens flare, gradients, bloom, glow spread, text animation, kinetic typography, any warmth in the black, any color other than white and black",
    generateStillFirst: true,
    criticalShot: false,
  },
  {
    id: "hero-02-approach",
    name: "THE APPROACH",
    deliverable: "hero",
    number: 2,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose:
      "Establish the person. Ground the viewer in physical reality after the abstract void.",
    prompt: `SCENE: Dark bedroom at 2AM. Only light source is a dim warm bedside lamp casting soft amber glow from frame right. Faint cool blue ambient from an unseen window. Everything else falls to darkness.

SUBJECT: Person in their early 30s, natural appearance, wearing a dark charcoal crew-neck cotton shirt, seated on the edge of a bed. Hands holding a phone face-down in their lap. Expression is contemplative, neutral, looking at nothing. Shoulders slightly hunched. Bare feet visible. Breathing naturally. They slowly lift the phone, and cool white light begins to appear on their chin and jawline.

CAMERA: Medium-wide shot, 50mm lens equivalent, shallow depth of field, static locked tripod, zero camera movement. Subject in right third of frame. Vast dark negative space fills the left two-thirds and above. 9:16 vertical framing.

LIGHTING: Warm practical lamp (3200K) from right. Cool ambient (6500K) barely visible in background. 6:1 fill ratio. Deep shadows. Gradual falloff. Cinematic darkness.

STYLE: David Fincher Mindhunter aesthetic. Spike Jonze Her soft loneliness. Shot on ARRI Alexa Mini LF, Kodak Vision3 500T. Bleach bypass color grade. Desaturated. Crushed blacks. Bradford Young cinematography reference.

MOTION: Minimal. Natural breathing. One slow blink. Phone lifts slightly at the end. Real-time, no slow motion.`,
    negativePrompt:
      "bright rooms, multiple lights, modern apartment decor, plants, wall art, neon, RGB lighting, dramatic expressions, fast movement, extra fingers, crossed eyes, AI glow effects",
    generateStillFirst: true,
    criticalShot: true,
    variants: 5,
  },
  {
    id: "hero-03-reading",
    name: "THE READING",
    deliverable: "hero",
    number: 3,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose:
      "The private act. The viewer watches someone read something that changes them.",
    prompt: `SCENE: Same dark bedroom. Now the phone screen is the only light source, casting cool blue-white glow upward onto the subject's face from below. The bedside lamp has been turned off or is no longer visible. Total darkness surrounds.

SUBJECT: Same person, dark crew-neck. Now holding phone at chest level, screen facing them. Eyes scanning left to right — reading intently. Expression: focused, curious. The phone light creates dramatic under-lighting on jaw, cheekbones, lower eye sockets. The top of the head falls into shadow.

CAMERA: Medium close-up, 85mm portrait lens, f/2.0 shallow DOF. Framed from mid-chest to just above head. Static locked. Subject slightly left of center. Eye level.

LIGHTING: Phone screen ONLY. Cool white (5500K-6000K) from below. No fill. No rim. No bounce. Shadow ratio 8:1. The darkness IS the co-star.

STYLE: Fincher interrogation intimacy. Bleach bypass. Desaturated skin. ARRI Alexa LF, Kodak 500T.

MOTION: Eyes scanning naturally (reading). Subtle micro-expressions as they absorb content. Natural breathing. Phone held steady. Real-time.`,
    negativePrompt:
      "visible screen content, bright environment, multiple lights, dramatic expressions, tears, smiling, rapid blinking, extra fingers on phone, colored lighting",
    generateStillFirst: true,
    criticalShot: true,
    variants: 3,
  },
  {
    id: "hero-04-stillness",
    name: "THE STILLNESS",
    deliverable: "hero",
    number: 4,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose:
      "The moment. The eyes stop. Something landed. This is the shot that makes the ad.",
    prompt: `SCENE: Extreme close-up continuation. Same person, same darkness, same phone light from below.

SUBJECT: Tight on eyes and upper face ONLY. Phone light catches the iris in exquisite detail — you can see the reflection of the screen in their eyes. The eyes STOP moving. Complete stillness. They've read something that hit. A single, long, slow blink. When eyes reopen, the expression has shifted — not dramatically, but undeniably. The jaw softens almost imperceptibly. Recognition.

CAMERA: Extreme close-up, 135mm telephoto compression. Very shallow DOF. Static. Uncomfortably intimate framing. Only eyes, bridge of nose, and upper cheeks visible.

LIGHTING: Phone screen from below only. The iris catches light — almost luminous against the surrounding darkness.

STYLE: Macro-intimate. The kind of shot Fincher would hold for 15 seconds. Denis Villeneuve's Arrival — the moment Louise understands. ARRI Alexa extreme close-up texture.

MOTION: Eyes scanning, then STOP. Hold completely still for 1.5 seconds. One slow blink (0.8 seconds). Eyes reopen with subtle shift in expression. Micro-movement only.`,
    negativePrompt:
      "tears, dramatic reaction, looking away, smiling, rapid blinking, any movement besides the blink, lens flare, visible phone frame",
    generateStillFirst: true,
    criticalShot: true,
    variants: 10,
  },
  {
    id: "hero-05-text-a",
    name: "TEXT CARD A",
    deliverable: "hero",
    number: 5,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Typographic breathing room. Information delivery.",
    prompt: `SCENE: Pure black void. White serif text on pure black background. Text reads: "No advice. No therapy. No reframe."

Typography: Cormorant Garamond or similar warm serif. Warm white (#F5F0EB) on pure black (#000000). Thin white horizontal rule (40px wide) centered above text. Text occupies center 40% of frame, 60% negative space.

ANIMATION: Text fades in over 0.5 seconds. Holds static. No other animation.

STYLE: A24 title card aesthetic. Minimalist. The black is the luxury.`,
    negativePrompt:
      "particles, gradients, animation, motion, color, glow, bloom",
    generateStillFirst: true,
    criticalShot: false,
  },
  {
    id: "hero-06-text-b",
    name: "TEXT CARD B",
    deliverable: "hero",
    number: 6,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Continued typographic sequence.",
    prompt: `SCENE: Pure black void. White serif text on pure black background. Text reads: "Just one question. And then silence."

Typography: Cormorant Garamond or similar warm serif. Warm white (#F5F0EB) on pure black (#000000). Thin white horizontal rule (40px wide) centered above text. Text occupies center 40% of frame, 60% negative space.

ANIMATION: Text fades in over 0.5 seconds. Holds static. No other animation.

STYLE: A24 title card aesthetic. Minimalist. The black is the luxury.`,
    negativePrompt:
      "particles, gradients, animation, motion, color, glow, bloom",
    generateStillFirst: true,
    criticalShot: false,
  },
  {
    id: "hero-07-descent",
    name: "THE DESCENT",
    deliverable: "hero",
    number: 7,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose:
      "The person lowers the phone. Light recedes. They sink into darkness. The question lives in them now.",
    prompt: `SCENE: Same person, same darkness. The person slowly lowers the phone from their face. As the phone descends, the light gradually retreats from their features. Their face sinks into shadow. First the forehead disappears into black. Then the eyes. Then the nose. Last visible: the jaw and chin, still catching the fading phone glow. Finally, total darkness. The person is gone. Only the faintest outline remains — a silhouette against nothing.

CAMERA: Medium close-up, 85mm, same framing as Shot 3. SLOW DOLLY BACKWARD — pulling away from the subject at an almost imperceptible rate. Creating emotional distance as the light fades. The subject gets smaller in frame as darkness envelops them.

LIGHTING: Phone screen fading from full brightness to off over 4 seconds. The light recession IS the narrative. No other sources. Complete darkness at the end.

STYLE: Denis Villeneuve — the final shot of Blade Runner 2049. The subject consumed by the environment. Poetic darkness. ARRI Alexa, Kodak 500T, heavy bleach bypass.

MOTION: Phone lowering slowly and deliberately. Subject otherwise motionless. Slow dolly back. The stillness of someone who has been fundamentally rearranged.`,
    negativePrompt:
      "any sudden movement, looking at camera, standing up, emotional reaction, tears, fast phone movement, light bounce",
    cameraControl: {
      type: "simple",
      config: {
        horizontal: 0,
        vertical: 0,
        pan: 0,
        tilt: 0,
        roll: 0,
        zoom: -3, // Slow dolly back
      },
    },
    generateStillFirst: true,
    criticalShot: true,
    variants: 5,
  },
  {
    id: "hero-08-close",
    name: "THE CLOSE",
    deliverable: "hero",
    number: 8,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Brand reveal. The Mirror emerges from the darkness. CTA.",
    prompt: `SCENE: Pure black void. After 1 second of total darkness, a thin white circle with a small dot at its center fades in — The Mirror logo. Below it, serif text fades in: "The Mirror" in warm white. Holds for 2 seconds.

Below the title, smaller serif text fades in: "The question changes everything."

Bottom of frame, subtle: "Link in bio"

All text is warm white (#F5F0EB) on pure black. Each element fades in sequentially, 0.5s apart. Ultra-minimal. The logo breathes in the darkness.

STYLE: A24 end card. Lionsgate title aesthetic. Premium. Deliberate. The black is the luxury.`,
    negativePrompt:
      "animation, particles, gradients, color, glitch, motion graphics, anything that feels like a tech product ad",
    generateStillFirst: true,
    criticalShot: false,
  },
];

/**
 * CINEMATIC TRAILER: "WHAT ARE YOU AVOIDING?" (45-60s)
 * 12 shots total
 */
export const TRAILER_SHOTS: Shot[] = [
  {
    id: "trailer-01-black",
    name: "BLACK HOLD",
    deliverable: "trailer",
    number: 1,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Tension through absence. Uncomfortably long black hold.",
    prompt: `SCENE: Pure black void. Absolute darkness. No elements. No gradients. No particles. Just pure black (#000000) holding for the entire duration. Uncomfortable silence.

STYLE: The void before creation. The space where discomfort lives.`,
    negativePrompt:
      "any light, any color, any element, any particle, any gradient",
    generateStillFirst: true,
    criticalShot: false,
  },
  {
    id: "trailer-02-hands",
    name: "HANDS IN LAP",
    deliverable: "trailer",
    number: 2,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose:
      "Intimacy, private moment. Extreme close-up of hands holding phone.",
    prompt: `SCENE: Extreme close-up of hands in lap holding a phone. Dark fabric beneath (dark charcoal crew-neck material). Minimal lighting — only the faint glow from above suggesting the phone screen is about to activate. The hands are still, fingers gently resting on the phone edges.

CAMERA: Macro close-up, 100mm equivalent. Shallow DOF. Static. The intimacy of detail. Natural skin texture, visible knuckles and veins.

LIGHTING: Faint warm ambient from above (practical lamp out of frame). The phone screen is dark or just beginning to glow. Deep shadows.

STYLE: The moment before. Tactile intimacy. ARRI Alexa texture.`,
    negativePrompt:
      "extra fingers, deformed hands, bright lighting, visible face, colorful phone case, jewelry",
    generateStillFirst: true,
    criticalShot: true,
    variants: 5,
  },
  {
    id: "trailer-03-text-question",
    name: "TEXT: THE QUESTION",
    deliverable: "trailer",
    number: 3,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Accusation disguised as statement.",
    prompt: `SCENE: Pure black void. White serif text fades in: "You already know the question."

Typography: Cormorant Garamond, warm white (#F5F0EB), centered. Thin horizontal rule above. 0.5s fade-in, holds static.

STYLE: A24 minimalism. The accusation.`,
    negativePrompt: "color, gradients, animation, particles",
    generateStillFirst: true,
    criticalShot: false,
  },
  {
    id: "trailer-04-night-city",
    name: "NIGHT CITY WALK",
    deliverable: "trailer",
    number: 4,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose: "Isolation at scale. Person walking alone in empty city at night.",
    prompt: `SCENE: Empty city street at 3AM after rain. Wet asphalt reflecting distant amber streetlights. A lone figure walks away from camera, silhouette only. Long shot — the person is small against the urban emptiness. Steam rises from a subway grate. No other people. No cars. The city belongs to this one person and their thoughts.

CAMERA: Wide establishing shot, 24mm, deep focus (f/8). Static locked. The figure walks slowly through frame. 9:16 vertical — the tall buildings and empty sky amplify the vertical isolation.

LIGHTING: Distant sodium vapor streetlights (amber, warm) creating pools of light on wet ground. The figure is backlit — rim light only, no face visible. Reflections in puddles double the light sources. Fog or atmospheric haze creates light volume beams.

STYLE: Roger Deakins Blade Runner 2049 night exterior. Wong Kar-wai In the Mood for Love rain streets. Moody, painterly, desaturated. ARRI Alexa, Cooke S4 lenses.

MOTION: Person walks slowly, deliberately. No rush. Head slightly bowed. Hands in pockets. The walk of someone who can't sleep and has nowhere to be.`,
    negativePrompt:
      "other people, traffic, bright signage, neon, rain currently falling (aftermath only), visible face, fast walking, looking at phone",
    generateStillFirst: true,
    criticalShot: true,
    variants: 5,
  },
  {
    id: "trailer-05-car-rain",
    name: "CAR IN THE RAIN",
    deliverable: "trailer",
    number: 5,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose: "Nowhere to go. Trapped with yourself.",
    prompt: `SCENE: Interior of a parked car at night. Rain running down all windows, distorting the streetlights outside into abstract amber and white shapes. The person sits in the driver's seat, not driving. Engine off. Phone in hand, screen casting blue-white light upward onto their face. The rain on the windows creates moving shadow patterns on their skin — like thoughts shifting across their face.

CAMERA: Shot from passenger seat position, 35mm, f/2.0. Three-quarter angle on subject. Shallow DOF — rain on windows is beautiful bokeh behind them. Interior framing — the car is a confessional booth.

LIGHTING: Phone screen (cool, from below) + rain-filtered streetlights (warm amber, from all sides through windows). The interplay creates constantly shifting warm/cool shadows across the subject's face. Intimate and unsettled.

STYLE: Michael Mann Collateral (LA taxi night scenes). Claire Denis' High Life (confined space intimacy). ARRI Alexa, Panavision C-series anamorphic.

MOTION: Person is still. Rain moves on windows. Light patterns shift across their face. They glance down at the phone, reading. Micro-expressions of recognition. Natural breathing fogs the air slightly in the cold car.`,
    negativePrompt:
      "driving, dashboard lights, car radio, bright interior, other passengers, visible phone screen content",
    generateStillFirst: true,
    criticalShot: true,
    variants: 5,
  },
  {
    id: "trailer-06-text-avoiding",
    name: "TEXT: AVOIDING",
    deliverable: "trailer",
    number: 6,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Escalation.",
    prompt: `SCENE: Pure black void. White serif text fades in: "You've been avoiding it."

Typography: Cormorant Garamond, warm white (#F5F0EB), centered. Thin horizontal rule above. 0.5s fade-in, holds static.

STYLE: A24 minimalism. The escalation.`,
    negativePrompt: "color, gradients, animation, particles",
    generateStillFirst: true,
    criticalShot: false,
  },
  {
    id: "trailer-07-floor-surrender",
    name: "FLOOR SURRENDER",
    deliverable: "trailer",
    number: 7,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose: "Surrender. Stripped down.",
    prompt: `SCENE: An empty room — bare walls, wooden floor, no furniture except a single overhead bare bulb hanging from a wire. The person sits on the floor, back against the wall, legs extended or knees up. Phone resting face-down on the floor beside them. They're not looking at it. They're looking straight ahead at nothing. Post-question. The question has already been asked. This is the aftermath.

CAMERA: Wide shot, floor level, 24mm. The person is small in the frame — dwarfed by the empty room. The bare bulb is visible at the top of frame, creating a stark pool of light around the subject. 9:16 vertical — massive negative space above and below.

LIGHTING: Single bare overhead bulb (warm, 2700K). Creates a harsh circular pool of light on the floor around the subject, with deep black shadows where the light falls off. The walls recede into darkness above the light's reach. Hard shadows under chin, behind head on wall.

STYLE: Ari Aster Hereditary (domestic horror stillness). Steve McQueen Hunger (the stripped-down human). Dreyer's Passion of Joan of Arc (the face as landscape). ARRI Alexa, Zeiss Super Speed glass. Raw. Unflinching.

MOTION: Almost none. The person breathes. One slow head turn from staring ahead to looking down at the phone on the floor. Not picking it up. Just looking at it.`,
    negativePrompt:
      "furniture, decorations, natural light, multiple people, dramatic poses, crying, any color on walls",
    generateStillFirst: true,
    criticalShot: true,
    variants: 5,
  },
  {
    id: "trailer-08-finger-press",
    name: "FINGER PRESS",
    deliverable: "trailer",
    number: 8,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose: "The commitment. The click.",
    prompt: `SCENE: Extreme close-up, macro shot. A finger pressing down on a phone screen. The screen glow illuminates the fingertip from below — you can see the ridges of the fingerprint catching light. The moment of commitment. The decisive tap.

CAMERA: Macro, 100mm equivalent. Ultra-shallow DOF. Static. The finger is sharp, everything else falls to blur. The intimacy of a single gesture.

LIGHTING: Phone screen glow from below illuminating the finger. Cool blue-white. Nothing else.

STYLE: The moment of no return. Tactile. ARRI Alexa macro detail.`,
    negativePrompt:
      "extra fingers, deformed hands, visible screen content, bright environment, multiple fingers pressing",
    generateStillFirst: true,
    criticalShot: true,
    variants: 3,
  },
  {
    id: "trailer-09-text-sees",
    name: "TEXT: THE MIRROR SEES",
    deliverable: "trailer",
    number: 9,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Promise. Threat. Both.",
    prompt: `SCENE: Pure black void. White serif text fades in: "The Mirror sees what you can't."

Typography: Cormorant Garamond, warm white (#F5F0EB), centered. Thin horizontal rule above. 0.5s fade-in, holds static.

STYLE: A24 minimalism. The promise-threat.`,
    negativePrompt: "color, gradients, animation, particles",
    generateStillFirst: true,
    criticalShot: false,
  },
  {
    id: "trailer-10-recognition",
    name: "THE RECOGNITION",
    deliverable: "trailer",
    number: 10,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose: "The climax. The question lands.",
    prompt: `SCENE: Extreme close-up, same as hero Shot 4. Eyes reading phone, then STOP. Recognition. The question landed. This is the center of gravity of the entire trailer.

SUBJECT: Tight on eyes and upper face. Phone light catches the iris. Eyes stop moving. Complete stillness for 1.5 seconds. One slow blink. Eyes reopen with subtle shift in expression. Not dramatic — undeniable.

CAMERA: Extreme close-up, 135mm. Very shallow DOF. Static. Uncomfortably intimate.

LIGHTING: Phone screen from below only. Luminous iris against darkness.

STYLE: Fincher hold. Villeneuve Arrival moment. The macro-intimate.`,
    negativePrompt:
      "tears, dramatic reaction, looking away, smiling, rapid blinking, lens flare",
    generateStillFirst: true,
    criticalShot: true,
    variants: 10,
  },
  {
    id: "trailer-11-phone-down",
    name: "PHONE DOWN",
    deliverable: "trailer",
    number: 11,
    duration: 5,
    aspectRatio: "9:16",
    mode: "pro",
    version: "2.6",
    purpose: "Aftermath. Silence.",
    prompt: `SCENE: Person places phone face-down on a surface (nightstand or floor). As they release it, the light recedes from them. They sit back into silhouette. Total darkness remains. They exist now only as a shape against black.

CAMERA: Medium shot, 50mm. Static. Watch the light retreat as the phone is placed down. The gesture of completion.

LIGHTING: Phone screen is the only source. As it's placed down, all light fades. The aftermath is darkness.

STYLE: The end of something. Denis Villeneuve. ARRI Alexa.

MOTION: Deliberate phone placement. Hand withdraws. Subject settles into stillness. Darkness completes.`,
    negativePrompt:
      "bright environment, dramatic reaction, picking phone back up, any light sources after phone is down",
    generateStillFirst: true,
    criticalShot: true,
    variants: 3,
  },
  {
    id: "trailer-12-logo",
    name: "LOGO END",
    deliverable: "trailer",
    number: 12,
    duration: 5,
    aspectRatio: "9:16",
    mode: "std",
    version: "2.6",
    purpose: "Brand as quiet authority.",
    prompt: `SCENE: Pure black void. The Mirror logo (thin white circle with center dot) fades in. Below: "The Mirror" in warm white serif. Below that: "The question changes everything."

Each element fades in sequentially, 0.5s apart. Ultra-minimal.

STYLE: A24/Lionsgate end card. Premium. Deliberate.`,
    negativePrompt: "animation, particles, gradients, color, motion graphics",
    generateStillFirst: true,
    criticalShot: false,
  },
];

/**
 * TEXT CARDS — Generate as stills, composite in post
 */
export const TEXT_CARDS: TextCard[] = [
  {
    id: "text-01",
    text: "I built an AI that refuses to help you.",
    duration: 3,
    fontFamily: "Cormorant Garamond",
    fontSize: 48,
    color: "#F5F0EB",
    backgroundColor: "#000000",
    horizontalRule: true,
    fadeInDuration: 0.8,
  },
  {
    id: "text-02",
    text: "No advice. No therapy. No reframe.",
    duration: 2.5,
    fontFamily: "Cormorant Garamond",
    fontSize: 42,
    color: "#F5F0EB",
    backgroundColor: "#000000",
    horizontalRule: true,
    fadeInDuration: 0.5,
  },
  {
    id: "text-03",
    text: "Just one question. And then silence.",
    duration: 2.5,
    fontFamily: "Cormorant Garamond",
    fontSize: 42,
    color: "#F5F0EB",
    backgroundColor: "#000000",
    horizontalRule: true,
    fadeInDuration: 0.5,
  },
  {
    id: "text-04",
    text: "You already know the question.",
    duration: 3,
    fontFamily: "Cormorant Garamond",
    fontSize: 42,
    color: "#F5F0EB",
    backgroundColor: "#000000",
    horizontalRule: true,
    fadeInDuration: 0.5,
  },
  {
    id: "text-05",
    text: "You've been avoiding it.",
    duration: 2.5,
    fontFamily: "Cormorant Garamond",
    fontSize: 42,
    color: "#F5F0EB",
    backgroundColor: "#000000",
    horizontalRule: true,
    fadeInDuration: 0.5,
  },
  {
    id: "text-06",
    text: "The Mirror sees what you can't.",
    duration: 3,
    fontFamily: "Cormorant Garamond",
    fontSize: 42,
    color: "#F5F0EB",
    backgroundColor: "#000000",
    horizontalRule: true,
    fadeInDuration: 0.5,
  },
  {
    id: "text-07",
    text: "The question changes everything.",
    duration: 3,
    fontFamily: "Cormorant Garamond",
    fontSize: 38,
    color: "#F5F0EB",
    backgroundColor: "#000000",
    horizontalRule: false,
    fadeInDuration: 0.5,
  },
];

/**
 * Get all shots for a specific deliverable
 */
export function getShotsForDeliverable(
  deliverable: Shot["deliverable"],
): Shot[] {
  const allShots = [...HERO_SHOTS, ...TRAILER_SHOTS];
  return allShots.filter((shot) => shot.deliverable === deliverable);
}

/**
 * Get all critical shots (require multiple variants)
 */
export function getCriticalShots(): Shot[] {
  const allShots = [...HERO_SHOTS, ...TRAILER_SHOTS];
  return allShots.filter((shot) => shot.criticalShot);
}

/**
 * Calculate total credits needed for full production
 */
export function calculateCreditBudget(): {
  stills: number;
  videos: number;
  totalCredits: number;
  breakdown: {
    category: string;
    images: number;
    videos: number;
    credits: number;
  }[];
} {
  const allShots = [...HERO_SHOTS, ...TRAILER_SHOTS];

  let totalStills = 0;
  let totalVideos = 0;
  const breakdown: {
    category: string;
    images: number;
    videos: number;
    credits: number;
  }[] = [];

  // Hero shots
  const heroShots = HERO_SHOTS;
  const heroStills = heroShots.reduce(
    (sum, s) => sum + (s.generateStillFirst ? s.variants || 1 : 0),
    0,
  );
  const heroVideos = heroShots.reduce((sum, s) => sum + (s.variants || 1), 0);
  totalStills += heroStills;
  totalVideos += heroVideos;
  breakdown.push({
    category: "Hero Commercial",
    images: heroStills,
    videos: heroVideos,
    credits: heroStills * 1 + heroVideos * 20,
  });

  // Trailer shots
  const trailerShots = TRAILER_SHOTS;
  const trailerStills = trailerShots.reduce(
    (sum, s) => sum + (s.generateStillFirst ? s.variants || 1 : 0),
    0,
  );
  const trailerVideos = trailerShots.reduce(
    (sum, s) => sum + (s.variants || 1),
    0,
  );
  totalStills += trailerStills;
  totalVideos += trailerVideos;
  breakdown.push({
    category: "Cinematic Trailer",
    images: trailerStills,
    videos: trailerVideos,
    credits: trailerStills * 1 + trailerVideos * 20,
  });

  // Iteration buffer (30%)
  const iterationBuffer = Math.ceil((totalStills * 1 + totalVideos * 20) * 0.3);
  breakdown.push({
    category: "Iteration Buffer (30%)",
    images: 0,
    videos: 0,
    credits: iterationBuffer,
  });

  const totalCredits = totalStills * 1 + totalVideos * 20 + iterationBuffer;

  return {
    stills: totalStills,
    videos: totalVideos,
    totalCredits,
    breakdown,
  };
}

export const ALL_SHOTS = [...HERO_SHOTS, ...TRAILER_SHOTS];
