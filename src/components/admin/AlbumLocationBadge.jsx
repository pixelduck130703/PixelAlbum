import { FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { albumLocationDisplay } from '../../services/albumLocation';

export default function AlbumLocationBadge({ detail, daily }) {
  const { label, title, shared, mapsUrl } = albumLocationDisplay(detail, daily);
  const className = `inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap sm:rounded-full sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${
    detail?.location && detail.location !== 'Không xác định' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
  }`;
  const content = <>
    <FaMapMarkerAlt aria-hidden="true" className="shrink-0 text-rose-600 text-[10px]" />
    <span className="max-w-[130px] truncate sm:max-w-none">{shared ? `Vị trí · ${label}` : label}</span>
    {mapsUrl && <FaExternalLinkAlt aria-hidden="true" className="shrink-0 text-[9px]" />}
  </>;

  if (mapsUrl) return <a href={mapsUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`Mở vị trí gần đúng ${label} trên Google Maps (tab mới)`} title={title} className={`${className} cursor-pointer underline decoration-dotted underline-offset-2 transition hover:bg-rose-200 focus-visible:outline-2 focus-visible:outline-rose-600`}>{content}</a>;
  return <span className={className} title={title}>{content}</span>;
}
