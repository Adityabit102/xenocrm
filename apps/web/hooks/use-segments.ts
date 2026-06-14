import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface CreateSegmentPayload {
  name: string;
  description?: string | null;
  filterRules: any;
  naturalLanguageQuery?: string | null;
  createdByAi?: boolean;
}

export interface UpdateSegmentPayload {
  id: string;
  name: string;
  description?: string | null;
  filterRules: any;
  naturalLanguageQuery?: string | null;
  createdByAi?: boolean;
}




export function useSegments() {
  return useQuery({
    queryKey: ["segments"],
    queryFn: async () => {
      const { data } = await axios.get("/api/segments");
      return data;
    }
  });
}




export function useSegment(id: string) {
  return useQuery({
    queryKey: ["segment", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/segments/${id}`);
      return data;
    },
    enabled: !!id
  });
}





export function useCreateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSegmentPayload) => {
      const { data } = await axios.post("/api/segments", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
    }
  });
}





export function useUpdateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSegmentPayload) => {
      const { id, ...data } = payload;
      const response = await axios.put(`/api/segments/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ["segment", data.id] });
      }
    }
  });
}





export function useDeleteSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/segments/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      queryClient.invalidateQueries({ queryKey: ["segment", id] });
    }
  });
}





export function usePreviewSegment() {
  return useMutation({
    mutationFn: async (filterRules: any) => {
      const { data } = await axios.post("/api/segments/preview", { rules: filterRules });
      return data;
    }
  });
}




export function useAIBuildSegment() {
  return useMutation({
    mutationFn: async (query: string) => {
      const { data } = await axios.post("/api/segments/ai-build", { query });
      return data;
    }
  });
}
