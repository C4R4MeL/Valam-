'use client'

import { MapPin, Truck, FlaskConical, CheckCircle2, Factory } from 'lucide-react'

export function TimelineHistory({ batch }: { batch: any }) {
  const traceLogs = batch.trace_logs || []
  
  // Map database logs to timeline events
  const events = traceLogs.map((log: any, index: number) => {
    let icon = CheckCircle2
    if (log.event_type === 'HARVESTED' || log.event_type === 'DISTILLED') icon = Factory
    else if (log.event_type === 'SHIPPED' || log.event_type === 'IN_TRANSIT') icon = Truck
    else if (log.event_type === 'IN_LAB') icon = FlaskConical
    else if (log.event_type === 'LAB_VERIFIED') icon = CheckCircle2
    
    return {
      id: log.id || index,
      title: log.event_type,
      location: log.location_name || log.location_district,
      date: new Date(log.event_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
      description: log.description || '',
      icon: icon,
      status: 'completed'
    }
  })

  // Fallback if no logs yet
  if (events.length === 0) {
    events.push({
      id: 'draft',
      title: 'Batch Didaftarkan',
      location: `${batch.origin_village || ''} ${batch.origin_district || ''}`.trim() || 'Lokasi tidak diketahui',
      date: new Date(batch.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
      description: 'Menunggu proses selanjutnya.',
      icon: Factory,
      status: 'completed'
    })
  }

  return (
    <div className="relative border-l-2 border-emerald-100 ml-6 space-y-10 py-4">
      {events.map((event, index) => {
        const isCompleted = event.status === 'completed'
        return (
          <div key={event.id} className="relative pl-8">
            {/* Timeline Node */}
            <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors
              ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}
            `}>
              <event.icon className="w-3.5 h-3.5" />
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <h3 className={`font-bold ${isCompleted ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  {event.title}
                </h3>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                  {event.date}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </div>
              
              <p className="text-sm text-zinc-600 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
