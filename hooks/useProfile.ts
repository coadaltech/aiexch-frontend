import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/profile');
      return response.data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMessage);
    },
  });
};