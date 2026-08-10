'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MapPin, Phone, Mail, Clock, Send, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Thank you! Your message has been sent successfully. We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">Contact Us</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Have a question, feedback, or a partnership inquiry? Drop us a message below and we will get back to you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Information & Hours */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-xl font-playfair font-bold text-foreground border-b border-border/40 pb-3">Get In Touch</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl mt-0.5">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Our Location</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        123 Beauty Lane, Glamour City,<br />Maharashtra, India - 400001
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl mt-0.5">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Call Us</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        +91 98765 43210 / +91 22 2345 6789
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl mt-0.5">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Email Support</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        support@beautyparle.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xl font-playfair font-bold text-foreground border-b border-border/40 pb-3">Working Hours</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock size={14} /> Monday - Friday
                    </span>
                    <span className="font-bold text-foreground">9:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock size={14} /> Saturday
                    </span>
                    <span className="font-bold text-foreground">10:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock size={14} /> Sunday
                    </span>
                    <span className="text-red-500 font-bold">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-playfair font-bold text-foreground border-b border-border/40 pb-3 mb-6">Send Us a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="Your email address"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="What is this inquiry about?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    placeholder="Enter your message details..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/95 transition font-bold disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Maps and Iframe Embed */}
          <div className="bg-card border border-border/50 rounded-3xl p-4 shadow-sm overflow-hidden h-96 w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.796440786523!2d72.8335!3d18.922!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDU1JzE5LjIiTiA3MsKwNTAnMDAuNiJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-2xl"
              title="Beauty Parlé Location Map"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
