import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

interface Domain {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

export const useDomains = () => {
  const queryClient = useQueryClient();

  const {
    data: domains = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const response = await adminApi.getDomains();
      return response.data.result || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi.createDomain({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.updateDomain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });

  return {
    domains,
    isLoading,
    error,
    refetch,
    createDomain: (name: string, options?: { onSuccess?: () => void }) => {
      createMutation.mutate(name, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["domains"] });
          options?.onSuccess?.();
        },
      });
    },
    updateDomain: (
      id: number,
      data: any,
      options?: { onSuccess?: () => void }
    ) => {
      updateMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["domains"] });
            options?.onSuccess?.();
          },
        }
      );
    },
    deleteDomain: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
