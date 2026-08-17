'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Wrench, Shield, Star, ChevronRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { galleryVideos } from '@/lib/videos';

const services = [
  { icon: Wrench, title: 'Car Accessories', desc: 'Premium accessories installed by experts' },
  { icon: Shield, title: 'Body Protection', desc: 'PPF, ceramic coating & paint protection' },
  { icon: Star, title: 'Interior Upgrade', desc: 'Seat covers, ambient lights & infotainment' },
];

const products = [
  { name: 'Infotainment', image: '/images/info.jpg' },
  { name: 'Speakers', image: '/images/speaker.jpg' },
  { name: 'LED Headlights', image: '/images/led.jpg' },
  { name: 'Dashcam & GPS', image: '/images/dashCam.jpg' },
  { name: 'Ceramic Coating', image: '/images/coating.jpg' },
  { name: 'Seat Covers', image: '/images/seat.jpg' },
  { name: 'Alloy Wheels', image: '/images/alloy.jpg' },
  { name: 'Spoiler', image: '/images/spoiler.jpg' },
  { name: 'Rear Bumper', image: '/images/bumper.jpg' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

function ProductImage({ name, image }: { name: string; image: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <>
      {status !== 'error' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {status !== 'loaded' && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted">
          <div className="text-center">
            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <span className="text-xs opacity-50">{name}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold">Falcon Car<span className="text-primary">X</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#services" className="hover:text-primary transition-colors">Services</a>
            <a href="#products" className="hover:text-primary transition-colors">Products</a>
            <a href="#gallery" className="hover:text-primary transition-colors">Gallery</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <Link href="/login" className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm rounded-lg transition-colors">
            Staff Login
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-background to-background" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
              Premium Car Accessories & Services
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Transform Your Ride With <span className="text-primary">Falcon CarX</span>
            </h1>
            <p className="text-lg text-text-secondary mb-8 max-w-lg">
              Your one-stop destination for premium car accessories, expert installation, and top-notch vehicle care services.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#contact" className="px-6 py-3 bg-primary hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact Us
              </a>
              <a href="#products" className="px-6 py-3 border border-border hover:border-primary text-text-primary rounded-lg font-medium transition-colors flex items-center gap-2">
                View Products <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-3">Our Services</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-text-secondary max-w-md mx-auto">
              Professional installations and premium quality products for every vehicle.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-6 rounded-2xl bg-surface-2 border border-border hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products Gallery ── */}
      <section id="products" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-3">Our Products</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-text-secondary max-w-md mx-auto">
              Browse our range of premium car accessories and upgrades.
            </motion.p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <motion.div
                key={p.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-surface-2 relative overflow-hidden w-full">
                  <ProductImage name={p.name} image={p.image} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 z-10" />
                </div>
                <div className="p-4 bg-surface-2 transition-colors duration-300 group-hover:bg-primary/5">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors duration-300">{p.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery / Showcase ── */}
      <section id="gallery" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-3">Our Work</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-text-secondary max-w-md mx-auto">
              Check out recent installations and transformations done at Falcon CarX.
            </motion.p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryVideos.map((url, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300"
              >
                <video
                  src={url}
                  className="w-full aspect-[9/16] object-cover"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location & Contact ── */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-3">Visit Us</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-text-secondary max-w-md mx-auto">
              Drop by our garage or give us a call. We&apos;re always happy to help.
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl overflow-hidden border border-border h-[350px] bg-surface-2 flex items-center justify-center"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.8!2d80.2637!3d13.0569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5267e2f9a5f5b7%3A0x0!2sFalcon+Accessories!5e0!3m2!1sen!2sin!4v1700000000"
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Falcon CarX Location — Royapettah, Chennai"
              />
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <a
                      href="https://www.google.com/maps/search/Falcon+Accessories+LGN+Road+Royapettah+Chennai+600002"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      LGN ROAD, Border Thottam,<br />
                      Padupakkam, Royapettah,<br />
                      Chennai, Tamil Nadu 600002
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Contact</h3>
                    <p className="text-sm text-text-secondary">
                      Phone: <a href="tel:09940993309" className="hover:text-primary transition-colors">099409 93309</a><br />
                      Phone: <a href="tel:08489038780" className="hover:text-primary transition-colors">084890 38780</a><br />
                      WhatsApp: <a href="https://wa.me/919940993309" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">099409 93309</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Working Hours</h3>
                    <p className="text-sm text-text-secondary">
                      Mon – Sat: 9:00 AM – 8:00 PM<br />
                      Sunday: 10:00 AM – 5:00 PM
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:falconaccessorieschennai@gmail.com" className="text-sm text-text-secondary hover:text-primary transition-colors">
                      falconaccessorieschennai@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="font-bold">Falcon Car<span className="text-primary">X</span></span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/falconcarx/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center hover:bg-primary/20 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.1 4.1 0 011.523.99 4.1 4.1 0 01.99 1.524c.163.46.349 1.26.403 2.43.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.1 4.1 0 01-.99 1.523 4.1 4.1 0 01-1.524.99c-.46.163-1.26.349-2.43.403-1.265.058-1.645.07-4.849.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.1 4.1 0 01-1.523-.99 4.1 4.1 0 01-.99-1.524c-.163-.46-.349-1.26-.403-2.43C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.1 4.1 0 01.99-1.523A4.1 4.1 0 015.15 2.636c.46-.163 1.26-.349 2.43-.403C8.845 2.175 9.225 2.163 12 2.163zM12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.902.333 4.14.63a5.88 5.88 0 00-2.126 1.384A5.88 5.88 0 00.63 4.14C.333 4.902.13 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.058 1.278.261 2.151.558 2.913a5.88 5.88 0 001.384 2.126A5.88 5.88 0 004.14 23.37c.762.297 1.635.5 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.058 2.151-.261 2.913-.558a5.88 5.88 0 002.126-1.384 5.88 5.88 0 001.384-2.126c.297-.762.5-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.058-1.278-.261-2.151-.558-2.913a5.88 5.88 0 00-1.384-2.126A5.88 5.88 0 0019.86.63c-.762-.297-1.635-.5-2.913-.558C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center hover:bg-primary/20 transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="mailto:falconaccessorieschennai@gmail.com" className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center hover:bg-primary/20 transition-colors" aria-label="Email">
                <Mail className="w-4 h-4 text-text-secondary" />
              </a>
            </div>
            <p className="text-xs text-text-muted">© 2025 Falcon CarX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
