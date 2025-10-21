import axios from "axios";
const API_URL = "http://127.0.0.1:8000";

// NODES
export const getNodes = async () => {
  const res = await axios.get(`${API_URL}/nodes`);
  return res.data;
};
export const addNode = async (label) => {
  const res = await axios.post(`${API_URL}/add_node?label=${label}`);
  return res.data;
};
export const deleteNode = async (id) => {
  const res = await axios.delete(`${API_URL}/delete_node/${id}`);
  return res.data;
};

// EDGES
export const getEdges = async () => {
  const res = await axios.get(`${API_URL}/edges`);
  return res.data;
};
export const addEdge = async (source_id, target_id) => {
  const res = await axios.post(
    `${API_URL}/add_edge?source_id=${source_id}&target_id=${target_id}`
  );
  return res.data;
};
export const deleteEdge = async (id) => {
  const res = await axios.delete(`${API_URL}/delete_edge/${id}`);
  return res.data;
};
