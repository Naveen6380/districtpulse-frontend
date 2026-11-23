import type { AssistantAnswer } from "@/services/workspace.service";

const topics = [
  {
    id: "overview",
    match: /overview|dashboard|முகப்பு/,
    title: "Overview",
    url: "/overview",
    en: "Overview brings together the selected district's summary and priorities. Select a district first, then review the available incident and action summaries. These reflect records available to your account, not complete district coverage.",
    ta: "Overview-ல் தேர்ந்தெடுத்த மாவட்டத்தின் சுருக்கம், முன்னுரிமைகள் பார்க்கலாம். முதலில் மாவட்டத்தைத் தேர்வு செய்து incident, action விவரங்களைப் பாருங்கள். உங்கள் account-க்கு கிடைக்கும் பதிவுகள் மட்டுமே காட்டப்படும்.",
  },
  {
    id: "incidents",
    match: /incident|சம்பவ|இன்சிடென/,
    title: "Incidents",
    url: "/incidents",
    en: "Incidents lets you search and review district incidents, filter by priority and open a record for its details. Try ‘Open incidents’, then ‘Search bridge’ or ‘Show only critical’. An empty result means no matching stored records for the selected district and filters.",
    ta: "Incidents-ல் மாவட்ட சம்பவங்களைத் தேடலாம், priority filter போடலாம், பதிவைத் திறந்து விவரம் பார்க்கலாம். ‘Open incidents’, ‘Search bridge’, ‘Show only critical’ என்று சொல்லலாம். காலியாக இருந்தால் தேர்வு செய்த மாவட்டம் / filter-க்கு பொருந்தும் பதிவுகள் இல்லை.",
  },
  {
    id: "map",
    match: /\bmap\b|வரைபட/,
    title: "Map intelligence",
    url: "/map",
    en: "Map shows the selected district and available geolocated incidents. Change district using the district selector or ‘Switch district to Chennai’. You can pan and zoom manually; records without coordinates cannot appear as map markers.",
    ta: "Map-ல் தேர்ந்தெடுத்த மாவட்டமும் location உள்ள சம்பவங்களும் தெரியும். District selector அல்லது ‘Switch district to Chennai’ மூலம் மாவட்டம் மாற்றலாம். Pan / zoom செய்யலாம்; coordinates இல்லாத பதிவுகளுக்கு marker வராது.",
  },
  {
    id: "weather",
    match: /weather|forecast|வானிலை/,
    title: "Weather",
    url: "/weather",
    en: "Weather displays the selected district's available forecast and weather intelligence. Check the source, observation time and freshness before using it. A model forecast is not an IMD official warning; unavailable provider data is not a zero-risk forecast.",
    ta: "Weather-ல் மாவட்டத்திற்கான forecast, weather intelligence பார்க்கலாம். Source, observation time, freshness பாருங்கள். Model forecast என்பது IMD அதிகாரப்பூர்வ warning அல்ல; data கிடைக்காததை ஆபத்து இல்லை என்று கருதக்கூடாது.",
  },
  {
    id: "agriculture",
    match: /agricultur|agmarknet|market price|விவசாய|வேளாண்/,
    title: "Agriculture",
    url: "/agriculture",
    restricted: true,
    en: "Agriculture shows available district market-price records and agriculture information. Check the market, commodity, arrival date and price unit. Missing records do not mean the price is zero. Check the displayed source status for live or imported coverage.",
    ta: "Agriculture-ல் கிடைக்கும் மாவட்ட சந்தை விலை, வேளாண் தகவல்கள் பார்க்கலாம். Market, commodity, arrival date, விலை unit சரிபாருங்கள். பதிவு இல்லை என்றால் விலை பூஜ்ஜியம் அல்ல. Live / imported coverage-ஐ source status-ல் பாருங்கள்.",
  },
  {
    id: "reports",
    match: /report|briefing|அறிக்கை|ரிப்போர்ட்/,
    title: "Reports & Briefings",
    url: "/reports",
    restricted: true,
    en: "In Reports & Briefings choose the report period and filters, generate the report and review it before downloading. You can also say ‘Generate weekly report’. Reports use available authorised records; check dates and source coverage before sharing.",
    ta: "Reports & Briefings-ல் கால அளவு, filters தேர்வு செய்து report generate பண்ணி review செய்து download செய்யலாம். ‘Generate weekly report’ என்றும் சொல்லலாம். பகிரும் முன் dates, source coverage சரிபாருங்கள்.",
  },
  {
    id: "imports",
    match: /import|url|இம்போர்ட்|இறக்குமதி/,
    title: "Import URL",
    url: "/import-url",
    restricted: true,
    en: "Open Import URL, enter a public source URL and process it. If host approval is requested, review the source before approving. Open the saved result to inspect extracted text, tables and collection dates, then ask about that source. Login-protected or blocked sites may require an authorised integration or export; importing does not bypass their access controls.",
    ta: "Import URL-ல் public URL கொடுத்து process செய்யுங்கள். Host approval கேட்டால் source சரிபார்த்து approve செய்யுங்கள். Saved result-ல் text, tables, collection dates பார்த்து அந்த source பற்றி கேட்கலாம். Login / blocked site-க்கு authorised integration அல்லது export தேவைப்படலாம்; import access control-ஐ bypass செய்யாது.",
  },
  {
    id: "actions",
    match: /action|department|பணி|துறை/,
    title: "Actions & Departments",
    url: "/actions",
    en: "Actions tracks departmental follow-up and status. Departments groups monitoring by department. Your role controls which records and updates are available. Assistant record changes require confirmation; review the target record and proposed change before confirming.",
    ta: "Actions-ல் துறை follow-up, status பார்க்கலாம். Departments-ல் துறை வாரியாக monitoring பார்க்கலாம். உங்கள் role அடிப்படையில் பதிவுகள் / updates கிடைக்கும். Assistant மூலம் record மாற்றும்போது சரியான பதிவு, மாற்றம் பார்த்து confirm செய்யுங்கள்.",
  },
  {
    id: "voice",
    match: /voice|microphone|வாய்ஸ்|குரல்/,
    title: "Voice assistant",
    url: "/overview",
    en: "Choose English or Tamil, select your microphone and press Start voice input. Speak after Recording appears. With auto-send enabled, pause to submit; otherwise review the transcript and press Send. Try ‘Open map’, ‘Switch district to Chennai’ or ‘Generate weekly report’. You can type the same requests here.",
    ta: "English / தமிழ் தேர்வு செய்து microphone select பண்ணி Start voice input அழுத்துங்கள். Recording வந்ததும் பேசுங்கள். Auto-send இருந்தால் pause செய்ததும் submit ஆகும்; இல்லையென்றால் transcript பார்த்து Send கொடுங்கள். ‘Open map’, ‘Switch district to Chennai’, ‘Generate weekly report’ என்று சொல்லலாம். இதையே type செய்யலாம்.",
  },
  {
    id: "district",
    match: /district|மாவட்ட/,
    title: "District selection",
    url: "/overview",
    en: "Use the district selector to choose an available district, or say ‘Switch district to Chennai’. Pages and data requests then use that district. Districts can have different source coverage, so changing district does not guarantee every module has records.",
    ta: "District selector-ல் மாவட்டத்தைத் தேர்வு செய்யுங்கள் அல்லது ‘Switch district to Chennai’ சொல்லுங்கள். Pages, data requests அந்த மாவட்டத்திற்கு மாறும். ஒவ்வொரு மாவட்டத்திற்கும் source coverage மாறலாம்; எல்லா module-லும் data இருக்கும் என்று உறுதி இல்லை.",
  },
];

/** Product guidance is curated; live facts always go to the authorised data API. */
export function projectHelp(
  question: string,
  lead: boolean,
  previousTopic?: string,
): (AssistantAnswer & { topic: string }) | undefined {
  const q = question.toLowerCase().trim();
  const tamil = /[\u0B80-\u0BFF]/.test(q);
  const greeting = /^(hi|hello|hey|vanakkam|வணக்கம்|ஹாய்)[! .?]*$/.test(q);
  const followUp =
    /^(tell me more|explain more|how do i use (it|that)|how to use (it|that)|மேலும் சொல்லு|அதை எப்படி பயன்படுத்துவது)[?. ]*$/.test(
      q,
    );
  const explanation =
    /\b(?:how (?:to|do|can|does)|what (?:is|are|can|does)|explain|help|guide|features?|purpose|use pann|eppadi|epdi|enna)\b|எப்படி|என்ன|விளக்க|பயன்படுத்த/.test(
      q,
    );
  // Questions about real counts, forecasts or saved sources must keep their data scope.
  if (
    /how many|count|today|yesterday|latest|current|எத்தனை|இன்று|நேற்று|தற்போத|இந்த.*(?:url|source|டேட்டா)|this (?:url|source|import)|imported (?:data|source)/.test(
      q,
    )
  )
    return undefined;
  const topic = followUp
    ? topics.find((t) => t.id === previousTopic)
    : topics.find((t) => t.match.test(q));
  const general =
    /districtpulse|our (?:website|project|app)|this (?:website|project|app)|நம்ம.*(?:ப்ராஜெக்ட்|வெப்சைட்|திட்டம்)|உன்னால்|what can you do/.test(
      q,
    );
  if (!greeting && !(explanation && (topic || general)) && !(followUp && topic)) return undefined;
  if (topic) {
    const restriction =
      topic.restricted && !lead
        ? tamil
          ? "\nஇந்த page-க்கு Collector / administrator access தேவை."
          : "\nThis page requires Collector / administrator access."
        : "";
    return {
      answer: (tamil ? topic.ta : topic.en) + restriction,
      sources:
        topic.restricted && !lead
          ? []
          : [
              {
                id: `help-${topic.id}`,
                title: topic.title,
                url: topic.url,
                text: tamil ? topic.ta : topic.en,
              },
            ],
      notices: [],
      method: "application_help",
      topic: topic.id,
    };
  }
  return {
    answer: tamil
      ? "வணக்கம்! நான் DistrictPulse Assistant. இந்த website எப்படி பயன்படுத்துவது என்று விளக்கலாம்; அனுமதிக்கப்பட்ட மாவட்ட data / imported source பற்றி பதில் சொல்லலாம்; pages திறக்கலாம், மாவட்டம் மாற்றலாம். Overview, Incidents, Map, Weather, Actions, Reports, Import URL பற்றி கேளுங்கள். உதாரணம்: ‘How do I import a URL?’ அல்லது ‘Open incidents’."
      : "Hello! I'm your DistrictPulse Assistant. I can explain how to use this website, answer questions from authorised district records and imported sources, open pages and switch districts. Ask about Overview, Incidents, Map, Weather, Actions, Reports or Import URL. Try ‘How do I import a URL?’ or ‘Open incidents’.",
    sources: [],
    notices: [],
    method: "application_help",
    topic: "general",
  };
}
