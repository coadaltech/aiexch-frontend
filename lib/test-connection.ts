export const testBackendConnection = async () => {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('Backend connection test:', data);
    return data;
  } catch (error) {
    console.error('Backend connection failed:', error);
    throw error;
  }
};