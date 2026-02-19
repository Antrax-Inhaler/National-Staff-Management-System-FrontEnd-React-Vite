// hooks/useMemberProfile.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { memberService, type Member } from '../services/memberService';

// Extended interface with affiliate info
export interface MemberProfile extends Member {
  affiliate_logo_url?: string;
  affiliate_name?: string;
  photo_url?: string;
}

// Hook to fetch member profile with affiliate info
export const useMemberProfile = (memberId?: number) => {
  const { affiliateId } = useAuth();

  return useQuery({
    queryKey: ['member-profile', memberId, affiliateId],
    queryFn: async () => {
      if (!memberId && affiliateId) {
        // Fetch current user's profile
        const response = await fetch('/api/v1/profile/info', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        
        if (data.success) {
          return {
            ...data.data,
            // Ensure we have the fields we need
            id: data.data.id,
            first_name: data.data.first_name,
            last_name: data.data.last_name,
            photo_url: data.data.photo_url,
            affiliate_logo_url: data.data.affiliate_logo_url,
            affiliate_name: data.data.affiliate_name,
          } as MemberProfile;
        } else {
          throw new Error(data.message || 'Failed to fetch profile');
        }
      } else if (memberId) {
        // Fetch specific member's data
        const member = await memberService.getMember(memberId);
        
        // Try to get affiliate logo if member has affiliate
        if (member.affiliate_id) {
          try {
            // You might need to adjust this based on your API structure
            const affiliateResponse = await fetch(`/api/v1/affiliates/${member.affiliate_id}/logo`);
            if (affiliateResponse.ok) {
              const affiliateData = await affiliateResponse.json();
              return {
                ...member,
                affiliate_logo_url: affiliateData.logo_url,
                affiliate_name: affiliateData.name,
              } as MemberProfile;
            }
          } catch (error) {
            console.warn('Could not fetch affiliate logo:', error);
          }
        }
        
        return member as MemberProfile;
      }
      
      throw new Error('Member ID is required');
    },
    enabled: !!memberId || !!affiliateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get profile of current authenticated user
export const useCurrentUserProfile = () => {
  return useMemberProfile(); // Will fetch current user's profile
};