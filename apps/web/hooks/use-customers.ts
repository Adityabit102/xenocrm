import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface CustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  rfmTier?: string;
}




export function useCustomers(params: CustomersParams = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const { data } = await axios.get("/api/customers", { params });
      return data;
    }
  });
}




export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/customers/${id}`);
      return data;
    },
    enabled: !!id
  });
}




export function useCustomerStats() {
  return useQuery({
    queryKey: ["customer-stats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/customers/stats");
      return data;
    }
  });
}





export function useImportCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post("/api/customers/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
    }
  });
}





export function useImportOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post("/api/orders/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    }
  });
}
