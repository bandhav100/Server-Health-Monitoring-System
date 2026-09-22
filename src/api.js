import axiosClient, { unwrap } from './axiosClient';

// Re-export axiosClient as default and unwrap as named export
// for full backwards and forwards compatibility.
export { unwrap };
export default axiosClient;
