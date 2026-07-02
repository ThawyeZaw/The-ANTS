'use client';

import { type OrgTimelineItem } from '@/types';

export default function OrgTimeline({ items }: { items: OrgTimelineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-foreground-muted text-center py-8">
        No milestones yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border transform md:-translate-x-px" />

      <div className="space-y-10">
        {items.map((item, idx) => {
          const isLeft = idx % 2 === 0;

          return (
            <div
              key={item.id}
              className={`relative flex flex-col md:flex-row items-start gap-4 ${
                isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Dot on the line */}
              <div className="absolute left-4 md:left-1/2 top-0 w-3 h-3 rounded-full bg-primary border-2 border-background transform -translate-x-1/2 z-10" />

              {/* Spacer for dot alignment on md+ */}
              <div className="hidden md:block md:w-1/2" />

              {/* Content card */}
              <div
                className={`ml-10 md:ml-0 md:w-1/2 ${
                  isLeft ? 'md:pr-10 md:text-right' : 'md:pl-10 md:text-left'
                }`}
              >
                <div className="bg-background-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary mb-2">
                    {item.date}
                  </span>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {item.description}
                  </p>
                  {item.imageUrls && item.imageUrls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {item.imageUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`${item.title} - photo ${i + 1}`}
                          className="rounded-lg w-full max-h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
