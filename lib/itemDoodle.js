// Maps an item name (then description) to an ItemDoodle key. Order matters: first match wins,
// and every rule is tried against the name before any rule is tried against the description.
export const RULES = [
  ['snow', /\bac\b|a\/c|air.?cond|gas top|refrigerant|cooling/],
  ['cupcake', /cupcake|muffin/],
  ['bananabread', /banana bread/],
  ['croissant', /croissant|danish|puff pastry/],
  ['bun', /\bbuns?\b|\bpav\b/],
  ['bread', /bread|\bloaf\b|\btoast\b|\brusks?\b/],
  ['cake', /cake|brownie|pastry|tart\b/],
  ['diya', /\bdiyas?\b|deepam/],
  ['candle', /candle|\bwax\b/],
  ['hamper', /hamper|gift box|gift set/],
  ['charm', /charm/],
  ['keychain', /key.?chain|key ?ring/],
  ['frame', /frame|collage|polaroid/],
  ['macrame', /macram/],
  ['wallprint', /\bprint\b|poster|painting|canvas|wall art|tarot|\bwall\b/],
  ['tote', /\btote|\bbags?\b|pouch|purse/],
  ['elephant', /elephant|amigurumi|teddy|plush|\bdoll\b|soft toy|\btoy\b/],
  ['bouquet', /bouquet|\bflower|\broses?\b/],
  ['booties', /bootie|\bsocks?\b|\bshoes?\b/],
  ['bookmark', /bookmark/],
  ['cushion', /cushion|pillow|granny/],
  ['basket', /basket|grocery|groceries/],
  ['rice', /\brice\b|sona masoori|basmati|\batta\b|flour/],
  ['dal', /\bdal\b|lentil|pulses|moong|toor/],
  ['oilcan', /oil change|engine oil|lubric/],
  ['chain', /\bchain\b|\blube\b/],
  ['oilbottle', /\boil\b|\bghee\b/],
  ['herbs', /coriander|curry leaf|\bherbs?\b|\bmint\b|vegetable|greens/],
  ['milk', /\bmilk\b|\bcurd\b|dairy|paneer/],
  ['eggs', /\beggs?\b/],
  ['batter', /batter|\bidli\b|\bdosa\b|\bjar\b|pickle/],
  ['tank', /\btank\b|\bsump\b/],
  ['geyser', /geyser|water heater|boiler/],
  ['sink', /\bsink\b|unclog|drain|basin|\bblocked\b|\bclog/],
  ['tap', /\btaps?\b|faucet|dripping/],
  ['pipe', /\bpipe|leak|plumb/],
  ['fan', /\bfans?\b/],
  ['battery', /inverter|battery|\bups\b/],
  ['doorbell', /bell/],
  ['mcb', /\bmcb\b|\bfuse\b|breaker|earthing/],
  ['switch', /switch|socket|\bplug\b|wiring|\bwires?\b|sparks/],
  ['bulb', /\bled\b|bulb|light|lamp|downlight|batten/],
  ['plane', /airport|flight|\bkia\b|airline/],
  ['taxi', /\bcabs?\b|taxi|\buber\b|\bola\b/],
  ['auto', /\bautos?\b|rickshaw/],
  ['moon', /night|midnight/],
  ['road', /outstation|highway|one way|road trip|mysuru|\btrip\b/],
  ['tyre', /puncture|\btyres?\b|\btires?\b/],
  ['brake', /brake/],
  ['gear', /\bgears?\b|clutch|engine|mechanic|garage/],
  ['bike', /\bbikes?\b|scooter|two.?wheeler|motorcycle|\bcycle\b/],
  ['car', /\bcar\b|sedan|vehicle|\bsuv\b/],
  ['translate', /translat|kannada|hindi|language/],
  ['maths', /\bmaths?\b|mathematics|algebra|calculus/],
  ['atom', /physics|chemistry|science|biology/],
  ['english', /english|spoken|conversation|grammar/],
  ['notes', /\bnotes?\b|revision|question bank|summary/],
  ['typing', /typing|typist|keyboard|data entry|assignment/],
  ['laptop', /project|slides|research|laptop|computer|presentation|\bppt\b/],
  ['runner', /errand|runner|\bpickup\b|\bdrop\b|delivery/],
  ['book', /\bbooks?\b|tuition|\bclass\b|tutor|lesson|study/],
  ['wrench', /repair|fix|install|fitting|replace|flush|toilet|service/],
];

export function itemDoodleKey(name = '', description = '') {
  const n = String(name || '').toLowerCase();
  const d = String(description || '').toLowerCase();
  for (const [key, re] of RULES) if (re.test(n)) return key;
  for (const [key, re] of RULES) if (re.test(d)) return key;
  return null;
}

// Small stable string hash, so the same item always looks the same.
export function hashStr(s = '') {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
