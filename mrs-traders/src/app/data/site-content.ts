export type NavItem = {
  label: string;
  path: string;
};

export type StatItem = {
  value: string;
  label: string;
};

export type ServiceItem = {
  title: string;
  description: string;
  image: string;
};

export type ProductItem = {
  title: string;
  description: string;
};

export type FeatureItem = {
  title: string;
  description: string;
  icon: string;
};

export type GalleryItem = {
  image: string;
  alt: string;
  height: string;
};

export type TestimonialItem = {
  name: string;
  quote: string;
  tag: string;
};

export type BusinessHour = {
  day: string;
  hours: string;
};

export const navItems: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Products', path: '/products' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' }
];

export const stats: StatItem[] = [
  { value: '2,500+', label: 'Happy Customers' },
  { value: '120+', label: 'Product Categories' },
  { value: '15+', label: 'Years of Service' }
];

export const services: ServiceItem[] = [
  {
    title: 'Electrical Solutions',
    description:
      'Reliable switches, wires, accessories, and everyday electrical essentials for homes, shops, and project sites.',
    image:
      'https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Plumbing Essentials',
    description:
      'Durable PVC pipes, fittings, valves, and practical plumbing supplies chosen for long-lasting local use.',
    image:
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Modern Lighting',
    description:
      'Decorative lights, LED solutions, and elegant fixtures that bring warmth, efficiency, and showroom appeal.',
    image:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'
  }
];

export const products: ProductItem[] = [
  {
    title: 'LED Bulbs',
    description: 'Energy-efficient lighting options for homes, offices, and retail spaces.'
  },
  {
    title: 'Switches',
    description: 'Premium modular switches with a clean look and dependable everyday performance.'
  },
  {
    title: 'Electrical Wires',
    description: 'Safe, durable wiring solutions for residential and commercial requirements.'
  },
  {
    title: 'PVC Pipes',
    description: 'Trusted plumbing-grade pipes and accessories for repair, replacement, and new installations.'
  },
  {
    title: 'Decorative Lights',
    description: 'Statement lighting pieces that elevate rooms, entrances, and festive spaces.'
  },
  {
    title: 'Bathroom Fittings',
    description: 'Functional, stylish fittings selected for local homes and practical daily use.'
  }
];

export const features: FeatureItem[] = [
  {
    title: 'Quality Products',
    description: 'Carefully selected inventory from dependable categories that customers trust.',
    icon: 'spark'
  },
  {
    title: 'Affordable Pricing',
    description: 'Competitive local pricing without compromising on durability or finish.',
    icon: 'wallet'
  },
  {
    title: 'Trusted Service',
    description: 'A neighborhood-first approach built on repeat customers and clear guidance.',
    icon: 'shield'
  },
  {
    title: 'Fast Customer Support',
    description: 'Quick responses on WhatsApp and helpful in-store assistance when you need it.',
    icon: 'chat'
  }
];

export const gallery: GalleryItem[] = [
  {
    image:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
    alt: 'Premium lighting display for a modern showroom',
    height: 'sm:col-span-1 sm:row-span-2'
  },
  {
    image:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    alt: 'Warm decorative lights inside a premium home interior',
    height: 'sm:col-span-1 sm:row-span-1'
  },
  {
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    alt: 'Modern ceiling lights and elegant electrical decor',
    height: 'sm:col-span-1 sm:row-span-1'
  },
  {
    image:
      'https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&w=900&q=80',
    alt: 'Detailed lighting fixtures and product showcase',
    height: 'sm:col-span-2 sm:row-span-1'
  }
];

export const testimonials: TestimonialItem[] = [
  {
    name: 'S. Prakash',
    quote:
      'Very helpful shop for electrical materials. They explain product choices clearly and the pricing feels fair.',
    tag: 'House Renovation Customer'
  },
  {
    name: 'K. Revathi',
    quote:
      'We bought decorative lights and switches here. The collection looked premium and the service was respectful.',
    tag: 'Local Homeowner'
  },
  {
    name: 'M. Senthil',
    quote:
      'Good place in Ayyampet for plumbing and lighting items. Quick support on WhatsApp made ordering easy.',
    tag: 'Contractor'
  }
];

export const businessHours: BusinessHour[] = [
  { day: 'Monday - Saturday', hours: '8:30 AM - 8:00 PM' },
  { day: 'Sunday', hours: '10:00 AM - 1:00 PM' }
];

export const businessInfo = {
  name: 'M.R.S Traders',
  owner: 'M. Raja',
  category: 'Electrical, Plumbing & Lighting Store',
  whatsappNumber: '9943459843',
  whatsappLink: 'https://wa.me/919943459843',
  address: '3/1, Azath Nagar 2nd Street, Ayyampet, Thanjavur, Tamil Nadu - 614201'
};
