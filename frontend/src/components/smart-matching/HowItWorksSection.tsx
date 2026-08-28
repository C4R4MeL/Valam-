'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Step {
  title: string;
  desc: string;
}

interface HowItWorksSectionProps {
  badge: string;
  title: string;
  subtitle: string;
  step1: Step;
  step2: Step;
  step3: Step;
}

export function HowItWorksSection({
  badge,
  title,
  subtitle,
  step1,
  step2,
  step3,
}: HowItWorksSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const steps = [
    { num: 1, colorClass: 'bg-forest-50 text-forest-700 border-forest-100', ...step1 },
    { num: 2, colorClass: 'bg-gold-50 text-gold-700 border-gold-100', ...step2 },
    { num: 3, colorClass: 'bg-terracotta-100/60 text-terracotta-700 border-terracotta-100/60', ...step3 },
  ];

  return (
    <section className="py-20 bg-white border-y border-zinc-150 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-forest-100 text-forest-700 px-4 py-1.5 rounded-full text-xs font-bold mb-3 border border-forest-200/50"
          >
            {badge}
          </motion.div>
          
          <motion.h2
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl md:text-4xl font-serif font-bold text-forest-950"
          >
            {title}
          </motion.h2>
          
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-warm-700 text-sm mt-3 leading-relaxed font-medium"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Timeline Grid */}
        <div className="relative flex flex-col justify-center">
          
          {/* Desktop Connecting Line (hidden on mobile) */}
          <div className="hidden md:block absolute top-[52px] left-[16%] right-[16%] h-[2px] z-0">
            <motion.div
              initial={prefersReducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={prefersReducedMotion ? {} : { scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
              className="w-full h-full border-t-2 border-dashed border-zinc-200 origin-left"
            />
          </div>

          {/* Mobile Connecting Line (hidden on desktop) */}
          <div className="md:hidden absolute top-[52px] bottom-16 left-[54px] w-[2px] z-0">
            <motion.div
              initial={prefersReducedMotion ? { scaleY: 1 } : { scaleY: 0 }}
              whileInView={prefersReducedMotion ? {} : { scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
              className="w-full h-full border-l-2 border-dashed border-zinc-200 origin-top"
            />
          </div>

          {/* Steps List */}
          <motion.div
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } }
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
          >
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
                }}
                className="flex flex-row md:flex-col items-center md:text-center gap-6 p-6 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-forest-200/50 hover:bg-white hover:shadow-md transition-all duration-300 group"
              >
                {/* Step Number Circle */}
                <div className={`w-14 h-14 rounded-2xl ${step.colorClass} border flex items-center justify-center font-bold text-lg shadow-inner group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                  {step.num}
                </div>

                {/* Step Content */}
                <div className="space-y-2 flex-1 md:flex-initial">
                  <h3 className="font-bold text-forest-950 text-base">{step.title}</h3>
                  <p className="text-warm-700 text-xs leading-relaxed max-w-sm font-medium">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>

      </div>
    </section>
  );
}

export default HowItWorksSection;
