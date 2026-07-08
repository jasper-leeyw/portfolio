export const DATA = {

  hero: {
    photo: "assets/profile-pic.PNG", // circular hero avatar; set to "" to hide
    photoAlt: "Jasper Lee",
    name: "Jasper Lee",
    title: "Software Engineer",
    positioning: "Backend & ML infrastructure · building with AI agents",
    accent: "AI agents", // phrase within `positioning` to highlight + trail the cursor
    intro: "Five years in software quality across Cisco, Zoom, Apple, and Meta — evaluating ML and computer-vision systems at scale. Now I'm channeling that into building: backend systems, ML-eval infrastructure, and AI agent tooling. I learn relentlessly on my own time, turning a hardware + QA foundation into an edge.",
    ctas: [
      { label: "View work", href: "#work", primary: true },
      { label: "Résumé", action: "resume", primary: false },
    ],
  },

  currently: [
    "At Meta (contract)",
    "Exploring SWE roles",
    "Python · ML infra",
    "Bay Area / San Jose",
  ],

  // Career history — also feeds the ascending career graph in the hero.
  // `type: "Contractor"` is rendered explicitly everywhere (Apple + Meta).
  experience: [
    {
      company: "Cisco Systems",
      logo: "assets/logos/cisco.svg",
      role: "QA Engineer",
      type: "",                    // full-time
      period: "Oct 2020 – Jul 2022",
      domain: "Hardware / EMC",
      year: "2020",                // short label for the graph
      tag: "Hardware",             // short domain for the graph
      mainProject: "FCC/CE Compliance & Lab Automation",
      skills: ["Python", "EMC Testing", "Lab Automation", "Cisco Catalyst"],
      highlights: [
        "Automated lab inventory, switch-port configuration, and test monitoring in Python — cut testing time 30%.",
        "Resolved 10+ EMC design failures to secure FCC/CE compliance for Cisco Catalyst products.",
      ],
    },
    {
      company: "Zoom",
      logo: "assets/logos/zoom.svg",
      role: "Software QA Engineer · Audio",
      type: "",                    // full-time
      period: "Jul 2022 – Jan 2024",
      domain: "Audio",
      year: "2022",
      tag: "Audio",
      mainProject: "Audio Quality Framework",
      skills: ["Python", "SQL", "YAML", "Signal Processing"],
      highlights: [
        "Built 20+ modular features for Zoom's E2E test framework (Python / SQL / YAML) — +30% coverage, 40% faster runs.",
        "Analyzed 1,000+ recordings with Python feature extraction (SNR, MOS) — cut audio complaints 25%.",
      ],
    },
    {
      company: "Apple",
      logo: "assets/logos/apple.svg",
      role: "Software QA Engineer · Video Engineering",
      type: "Contractor",
      period: "Nov 2024 – Apr 2025",
      domain: "Computer Vision / Vision Pro",
      year: "2024",
      tag: "Vision Pro",
      mainProject: "Vision Pro CV Test Suite",
      skills: ["Bash", "Computer Vision", "Test Design", "Precision/Recall"],
      highlights: [
        "Designed 60+ test cases (FP/TP) surfacing 15+ critical CV model issues across iOS and Vision Pro.",
        "Analyzed body-tracking model behavior (precision/recall); automated device setup via Bash — −50% setup time.",
      ],
    },
    {
      company: "Meta",
      logo: "assets/logos/meta.svg",
      role: "Quality Engineer · XR Codec Avatars",
      type: "Contractor",
      period: "Jun 2025 – Present",
      domain: "Computer Vision / AR",
      year: "2025",
      tag: "XR Avatars",
      mainProject: "XR Codec Avatars",
      skills: ["Python", "JavaScript", "ML Eval", "Data Pipeline"],
      highlights: [
        "Informed 13 Codec Avatar model releases via hotspot test plans across 16 categories and 450 subjects.",
        "Cut results turnaround 24h → under 1h with a Python pipeline (uploads, state tracking, annotation) for 800+ videos/batch.",
        "Built interactive JavaScript quality reports — score breakdowns, heatmaps, inter-rater reliability, fairness analysis.",
      ],
    },
  ],

  // Selected Work — case studies of real shipped work (narrative + public résumé
  // metrics, no proprietary code). `github`/`liveDemo` are optional; cards adapt.
  // The flagship personal project (LLM/agent eval harness) slots in here later.
  projects: [
    {
      slug: "codec-avatar",
      title: "Codec Avatar Eval Pipeline",
      source: "Meta · Contractor",
      logo: "assets/logos/meta.svg",
      thumbnail: "assets/thumbnails/meta-codec.jpg",
      github: "",
      liveDemo: "",
      tags: ["Python", "Automation", "ML Eval", "Data Pipeline"],
      desc: "Automated 3D avatar quality evaluation — cut turnaround from 24h to under an hour.",
      caseStudy: {
        problem: "Evaluating 3D Codec Avatar quality was slow (24h+ per batch) and fragmented across three separate issue sources, making release decisions hard to defend.",
        approach: "Built a Python pipeline automating uploads, state tracking, and annotation for 800+ videos per batch; consolidated 550+ issues into a single dataset; shipped interactive JavaScript reports with score breakdowns, heatmaps, inter-rater reliability, and fairness analysis.",
        outcome: "Turnaround dropped from 24h+ to under one hour, and the work informed 13 model releases across 16 hotspot categories and 450 subjects.",
        media: [
          // { type: "youtube", url: "https://www.youtube.com/watch?v=VIDEO_ID", caption: "Pipeline demo" },
        ],
      },
    },
    {
      slug: "vision-pro",
      title: "Vision Pro CV Test Suite",
      source: "Apple · Contractor",
      logo: "assets/logos/apple.svg",
      thumbnail: "assets/thumbnails/apple-visionpro.jpg",
      github: "",
      liveDemo: "",
      tags: ["Computer Vision", "Test Design", "Bash", "Precision/Recall"],
      desc: "Test design and model analysis surfacing 15+ critical CV issues on iOS and Vision Pro.",
      caseStudy: {
        problem: "Computer-vision models — including body tracking — on iOS and Vision Pro had quality issues that were hard to pin down and reproduce.",
        approach: "Designed 60+ FP/TP test cases, analyzed model behavior with precision/recall, expanded the QA database with 300+ aggressor cases, and automated device configuration + data collection via Bash scripts.",
        outcome: "Surfaced 15+ critical model issues driving fixes, cut setup time 50%, and standardized data packages across the team.",
        media: [
          // { type: "youtube", url: "https://www.youtube.com/watch?v=VIDEO_ID", caption: "Test suite walkthrough" },
        ],
      },
    },
    {
      slug: "zoom-audio",
      title: "Zoom Audio Quality Library",
      source: "Zoom",
      logo: "assets/logos/zoom.svg",
      thumbnail: "assets/thumbnails/zoom-audio.jpg",
      github: "",
      liveDemo: "",
      tags: ["Python", "Signal Processing", "E2E Testing", "SQL"],
      desc: "Feature-extraction library over 1,000+ recordings — cut audio complaints 25%.",
      caseStudy: {
        problem: "Audio complaints were rising, but quality was hard to quantify and E2E coverage for Meetings and Phone was limited.",
        approach: "Built an internal audio library extracting features (SNR, MOS) from 1,000+ recordings in Python, and added 20+ modular features to the E2E test framework (Python / SQL / YAML).",
        outcome: "Reduced audio complaints 25%, increased coverage 30%, and achieved 40% faster test runs.",
        media: [
          // { type: "youtube", url: "https://www.youtube.com/watch?v=VIDEO_ID", caption: "Audio quality demo" },
        ],
      },
    },
  ],

  about: [
    "I started in electrical engineering and hardware. At Cisco I chased down EMC design failures for FCC/CE compliance — which taught me to think in systems and failure modes before writing a line of code.",
    "From there I moved into software quality at increasingly demanding companies: Zoom (audio), Apple (computer vision on Vision Pro, as a contractor), and Meta (XR Codec Avatars, as a contractor). Somewhere along the way the work became building — Python pipelines, automation that cut day-long jobs to minutes, data infrastructure, interactive reporting.",
    "Now I'm making that the whole point. I build backend and ML-evaluation infrastructure, and I'm going deep on AI agent tooling on my own time. The hardware rigor and test-driven instinct don't go away — they're the edge I build with.",
  ],

  links: {
    resume: "assets/resume.pdf",
    email: "yaoweilee96@gmail.com",
    github: "https://github.com/jasper-leeyw",
    linkedin: "https://www.linkedin.com/in/jasper-lee1/",
    leetcode: "https://leetcode.com/u/leegatus17/",
    leetcodeUser: "leegatus17",
  },

};
