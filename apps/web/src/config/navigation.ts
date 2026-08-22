export const NAVIGATION_ITEMS = {
  super_admin: [
    { section: 'Enterprise Control', items: [
      { label: 'Observability', href: '/admin/observability' },
      { label: 'Webhooks', href: '/admin/webhooks' },
      { label: 'A/B Testing', href: '/admin/ab-tests' },
      { label: 'Vendor Approvals', href: '/admin/vendors' },
      { label: 'Audit Logs', href: '/admin/audit-logs' },
      { label: 'Active Sessions', href: '/admin/active-sessions' },
    ]},
    { section: 'Store Operations', items: [
      { label: 'Orders', href: '/admin/orders' },
      { label: 'Products', href: '/admin/products' },
      { label: 'Users', href: '/admin/users' },
    ]}
  ],
  admin: [
    { section: 'Store Management', items: [
      { label: 'Orders', href: '/admin/orders' },
      { label: 'Products', href: '/admin/products' },
      { label: 'Inventory', href: '/admin/inventory' },
      { label: 'Coupons', href: '/admin/coupons' },
      { label: 'Flash Sales', href: '/admin/flash-sale' },
      { label: 'Reviews', href: '/admin/reviews' },
      { label: 'UGC Moderation', href: '/admin/ugc' },
      { label: 'Support Tickets', href: '/admin/support' },
      { label: 'Live Shopping', href: '/admin/live-shopping' },
    ]}
  ],
  vendor: [
    { section: 'Vendor Portal', items: [
      { label: 'Merchant Console', href: '/vendor/dashboard' },
      { label: 'Register Partner', href: '/vendor/register' },
      { label: 'Wholesale Panel', href: '/wholesale/dashboard' },
      { label: 'Bulk Replenish', href: '/wholesale/order' },
    ]}
  ],
  user: [
    { section: 'AI & Social Hub', items: [
      { label: 'Virtual Try-On (AR)', href: '/try-on/ar' },
      { label: 'Skin DNA Dashboard', href: '/my-skin/dna' },
      { label: 'Visual Search', href: '/search/visual' },
      { label: 'Community Forums', href: '/community' },
      { label: 'Creator Uploads', href: '/creator/looks' },
      { label: 'Co-Shopping', href: '/live/room/new' },
    ]},
    { section: 'Shopping & Account', items: [
      { label: 'Products', href: '/products' },
      { label: 'Cart', href: '/cart' },
      { label: 'Wishlist', href: '/wishlist' },
      { label: 'Orders', href: '/orders' },
      { label: 'Profile', href: '/profile' },
      { label: 'Referrals', href: '/referral' },
      { label: 'Loyalty', href: '/loyalty' },
      { label: 'Support Chat', href: '/support/chat' },
    ]}
  ]
};
