export const CATEGORIES = [
  { key: 'taxi', label: 'Rides', doodle: 'auto', bg: '#EBD878', fg: '#4A3D00', blob: '#F6EDB0' },
  { key: 'plumbing', label: 'Plumbing', doodle: 'tap', bg: '#BEC6F7', fg: '#252B66', blob: '#DDE1FB' },
  { key: 'store', label: 'Kirana and stores', doodle: 'bag', bg: '#C9E0DA', fg: '#123F37', blob: '#E3F0ED' },
  { key: 'student', label: 'Student gigs', doodle: 'cap', bg: '#F0B9A8', fg: '#4A1D10', blob: '#F8D8CE' },
  { key: 'bakery', label: 'Cakes and bakery', doodle: 'cake', bg: '#EEDCD3', fg: '#52342A', blob: '#F8EEE9' },
  { key: 'crafts', label: 'Gifts and crafts', doodle: 'gift', bg: '#B5C285', fg: '#243012', blob: '#D2DBB0' },
  { key: 'crochet', label: 'Crochet', doodle: 'yarn', bg: '#D5C7EE', fg: '#34224F', blob: '#EAE1F8' },
  { key: 'electrical', label: 'Electrical', doodle: 'bulb', bg: '#BFDDF0', fg: '#123B54', blob: '#DDEEF8' },
  { key: 'auto', label: 'Autos and garage', doodle: 'wrench', bg: '#E7D3B8', fg: '#4A3418', blob: '#F3E7D4' },
];
export const OTHER = { key: 'other', label: 'Something else', doodle: 'spark', bg: '#F4E4DB', fg: '#52342A', blob: '#FBF0EA' };
export const NEED_CATEGORIES = [...CATEGORIES, OTHER];
export const catOf = (key) => (key === 'other' ? OTHER : CATEGORIES.find((c) => c.key === key) || CATEGORIES[2]);
export const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN');
export const STATUSES = ['new', 'accepted', 'ready', 'completed', 'cancelled'];
export const STEPS = [
  { key: 'new', title: 'Order placed', short: 'Placed' },
  { key: 'accepted', title: 'Accepted by the shop', short: 'Accepted' },
  { key: 'ready', title: 'Ready for pickup or delivery', short: 'Ready' },
  { key: 'completed', title: 'Completed', short: 'Done' },
];
export const STATUS_LINE = {
  new: 'Waiting for the shop to accept your order.',
  accepted: 'The shop accepted your order and is getting it ready.',
  ready: 'Your order is ready. Collect it, or expect delivery soon.',
  completed: 'All done. Pay the shop directly if you have not already.',
  cancelled: 'This order was cancelled.',
};
export const fmtTime = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
