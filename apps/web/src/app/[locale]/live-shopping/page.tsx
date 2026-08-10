'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Video, Calendar, Tv } from 'lucide-react';
import Link from 'next/link';

interface LiveEvent {
  id: number;
  title: string;
  description?: string;
  isLive: boolean;
  scheduledAt?: string;
}

export default function LiveEventsListPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live-shopping')
      .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('Failed to load events:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading live events...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-playfair font-bold text-foreground">Beauty Live Shopping</h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Join our beauty consultants live to watch tutorials, chat, and buy exclusive products directly during the broadcast!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -2 }}
                className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/45 transition"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        event.isLive
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {event.isLive ? (
                        <>
                          <Video className="w-3 h-3" /> Live Now
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3 h-3" /> Scheduled
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-playfair font-bold text-foreground line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
                  </div>
                </div>

                <div className="pt-6">
                  {event.isLive ? (
                    <Link
                      href={`/${locale}/live-shopping/${event.id}`}
                      className="w-full py-3 bg-red-500 text-white rounded-full font-bold text-xs hover:bg-red-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-500/10"
                    >
                      <Tv className="w-4 h-4" /> Watch Livestream
                    </Link>
                  ) : (
                    <div className="w-full py-3 bg-secondary text-muted-foreground rounded-full text-xs font-bold text-center border border-border/30">
                      Starts: {event.scheduledAt ? new Date(event.scheduledAt).toLocaleString() : 'Soon'}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
