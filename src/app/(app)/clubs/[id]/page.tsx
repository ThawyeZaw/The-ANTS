'use client';

import { useParams } from 'next/navigation';
import ClubDetail from '@/components/clubs/ClubDetail';

export default function ClubDetailPage() {
  const params = useParams<{ id: string }>();
  return <ClubDetail clubId={params.id} />;
}
