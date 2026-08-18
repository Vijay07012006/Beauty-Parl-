// Next.js 16 root instrumentation
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side vitals capture (optional)
  }
}

export const onRequestError = (err: any) => {
  console.error('Client Error Captured:', err);
  // Future: Isko backend API par bhejna taaki logs mein aaye
};
