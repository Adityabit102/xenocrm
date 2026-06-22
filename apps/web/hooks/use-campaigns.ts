import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Channel } from "@/types";

export interface CampaignsFilters {
  status?: string;
  channel?: Channel;
  page?: number;
  limit?: number;
}

export interface CreateCampaignPayload {
  name: string;
  segmentId: string;
  channel: Channel;
  messageTemplate: string;
  scheduledAt?: string | null;
  status?: "draft" | "scheduled";
  holdoutPct?: number;
  requireApproval?: boolean;
  createdByAgent?: boolean;
  agentReasoningTrace?: any;
}




export function useCampaigns(filters: CampaignsFilters = {}) {
  return useQuery({
    queryKey: ["campaigns", filters],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (filters.status !== undefined) params.status = filters.status;
      if (filters.channel !== undefined) params.channel = filters.channel;
      if (filters.page !== undefined) params.page = filters.page;
      if (filters.limit !== undefined) params.limit = filters.limit;
      const { data } = await axios.get("/api/campaigns", { params });
      return data;
    }
  });
}




export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/campaigns/${id}`);
      return data;
    },
    enabled: !!id
  });
}





export function useCampaignStats(id: string, campaignStatus?: string) {
  return useQuery({
    queryKey: ["campaign-stats", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/campaigns/${id}/stats`);
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) => {

      if (campaignStatus === "in_progress") return 5000;
      const cachedData: any = query.state.data;
      if (cachedData?.status === "in_progress") return 5000;
      return false;
    }
  });
}




export function useCampaignMessages(id: string, page: number = 1, limit: number = 50, status?: string) {
  return useQuery({
    queryKey: ["campaign-messages", id, page, limit, status],
    queryFn: async () => {
      const { data } = await axios.get(`/api/campaigns/${id}/messages`, {
        params: { page, limit, status }
      });
      return data;
    },
    enabled: !!id
  });
}





export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCampaignPayload) => {
      const { data } = await axios.post("/api/campaigns", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    }
  });
}





export function useDispatchCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post(`/api/campaigns/${id}/dispatch`);
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-stats", id] });
    }
  });
}

export interface UpdateCampaignPayload {
  id: string;
  name?: string;
  messageTemplate?: string;
  scheduledAt?: string | null;
  status?: "draft" | "scheduled" | "in_progress" | "completed" | "paused";
}




export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCampaignPayload) => {
      const { data } = await axios.patch(`/api/campaigns/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", data.id] });
    }
  });
}




export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete(`/api/campaigns/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    }
  });
}
