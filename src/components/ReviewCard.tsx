import { Star } from 'lucide-react';
import type { GoogleReview } from '../types';

interface Props {
  review: GoogleReview;
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < n ? 'fill-[#C4A044] text-[#C4A044]' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  );
}

export default function ReviewCard({ review }: Props) {
  const initials = review.author_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-[#E2DAC8] p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        {review.profile_photo_url ? (
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#1A2E17] text-[#C4A044] flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[#1A1A1A] text-sm truncate">{review.author_name}</p>
          <p className="text-xs text-gray-400">{review.relative_time_description}</p>
        </div>
      </div>

      <Stars n={review.rating} />

      {review.text && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{review.text}</p>
      )}
    </div>
  );
}
