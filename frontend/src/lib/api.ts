import api from "./axios";

// USERS API
export const syncUser = async (userData: any) => {
  const { data } = await api.post("/users/sync", userData);
  return data;
};

// Products API
export const getAllProducts = async () => {
  const { data } = await api.get("/products");
  return data.data;
};

export const getProductById = async (id: string) => {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
};

export const getMyProducts = async () => {
  const { data } = await api.get("/products/my");
  return data.data;
};

export const createProduct = async (productData: any) => {
  const { data } = await api.post("/products", productData);
  return data;
};

export const updateProduct = async ({
  id,
  ...productData
}: {
  id: string;
  [key: string]: any;
}) => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data;
};

export const deleteProduct = async (id: string) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

// Comments API
export const createComment = async ({
  productId,
  content,
}: {
  productId: string;
  content: string;
}) => {
  const { data } = await api.post(`/comments/${productId}`, { content });
  return data;
};

export const updateComment = async ({
  commentId,
  content,
}: {
  commentId: string;
  content: string;
}) => {
  const { data } = await api.put(`/comments/${commentId}`, { content });
  return data;
};

export const deleteComment = async ({ commentId }: { commentId: string }) => {
  const { data } = await api.delete(`/comments/${commentId}`);
  return data;
};
