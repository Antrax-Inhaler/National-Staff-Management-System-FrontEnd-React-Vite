// src/hooks/useMembers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService, type Member, type CreateMemberData } from '../services/memberService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ✅ Get all members for the current affiliate
export const useMembers = () => {
  const { affiliateId } = useAuth();

  return useQuery({
    queryKey: ['members', affiliateId],
    queryFn: () => memberService.getMembers(affiliateId!),
    enabled: !!affiliateId, // only run if affiliateId exists
  });
};

// ✅ Get a single member by ID
export const useMember = (memberId: number) => {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: () => memberService.getMember(memberId),
    enabled: !!memberId,
  });
};

// ✅ Create member with optimistic update
export const useCreateMember = () => {
  const queryClient = useQueryClient();
  const { affiliateId } = useAuth();

  return useMutation({
    mutationFn: (memberData: CreateMemberData) =>
      memberService.createMember({
        ...memberData,
        affiliate_id: affiliateId!,
      }),

    onMutate: async (newMember) => {
      await queryClient.cancelQueries({ queryKey: ['members', affiliateId] });

      const prevMembers = queryClient.getQueryData<Member[]>(['members', affiliateId]);

      // Temporary member for optimistic update
      const tempMember: Partial<Member> = {
        ...newMember,
        id: Date.now(), // temporary ID until backend returns real one
        status: 'Active',
      };

      queryClient.setQueryData<Member[]>(['members', affiliateId], (old = []) => [
        ...old,
        tempMember as Member,
      ]);

      return { prevMembers };
    },

    onError: (err: any, _, context) => {
      queryClient.setQueryData(['members', affiliateId], context?.prevMembers);
      toast.error(`Failed to create member: ${err.message || 'Unknown error'}`);
    },

    onSuccess: () => {
      toast.success('✅ Member created successfully!');
    },

    onSettled: () => {
      // Sync with backend
      queryClient.invalidateQueries({ queryKey: ['members', affiliateId] });
    },
  });
};

// ✅ Update member with optimistic update
export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { affiliateId } = useAuth();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Member> }) =>
      memberService.updateMember(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['members', affiliateId] });

      const prevMembers = queryClient.getQueryData<Member[]>(['members', affiliateId]);

      queryClient.setQueryData<Member[]>(['members', affiliateId], (old = []) =>
        old.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );

      return { prevMembers };
    },

    onError: (err: any, _, context) => {
      queryClient.setQueryData(['members', affiliateId], context?.prevMembers);
      toast.error(`❌ Update failed: ${err.message}`);
    },

    onSuccess: () => {
      toast.success('✅ Member updated successfully');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members', affiliateId] });
    },
  });
};

// ✅ Search members in the current affiliate
export const useSearchMembers = (query: string) => {
  const { affiliateId } = useAuth();

  return useQuery({
    queryKey: ['members', affiliateId, 'search', query],
    queryFn: () => memberService.searchMembers(affiliateId!, query),
    enabled: !!affiliateId && query.length > 2,
  });
};
