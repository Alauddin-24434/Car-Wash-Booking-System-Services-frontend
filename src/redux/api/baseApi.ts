import {
  BaseQueryApi,
  BaseQueryFn,
  DefinitionType,
  FetchArgs,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { logout, setUser } from "../features/auth/authSlice";
import { toast } from "sonner";

/**
 * Configure the base query with default settings.
 * - `baseUrl`: The base URL for all API requests.
 * - `credentials`: Include cookies in requests.
 * - `prepareHeaders`: A function to set the authorization header if a token exists.
 */
const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5000/api/", // Base API URL
  credentials: "include", // Include cookies in requests
  prepareHeaders: (headers, { getState }) => {
    // Retrieve the token from the Redux state
    const token = (getState() as RootState).auth.token;

    if (token) {
      // Set the Authorization header with the 'Bearer' prefix
      headers.set("Authorization", token);
    }

    return headers;
  },
});

const baseQueryWithRefreshToken: BaseQueryFn<
  FetchArgs,
  BaseQueryApi,
  DefinitionType
> = async (args, api, extraOptions): Promise<any> => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 404) {
    toast.error(result.error.data.message);
  }
  if (result?.error?.status === 403) {
    toast.error(result.error.data.message);
  }
  if (result?.error?.status === 401) {
 

    const res = await fetch("http://localhost:5000/api/auth/refresh-token", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (data?.data?.accessToken) {
      const user = (api.getState() as RootState).auth.user;

      api.dispatch(
        setUser({
          user,
          token: data.data.accessToken,
        })
      );

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

/**
 * Create the base API slice using Redux Toolkit Query.
 * - `reducerPath`: The key in the Redux state where the API state will be stored.
 * - `baseQuery`: The custom base query function with refresh token logic.
 * - `tagTypes`: Tags for caching and invalidating data.
 * - `endpoints`: A function to define endpoints (left empty here as a base API).
 */
export const baseApi = createApi({
  reducerPath: "baseApi", // Unique key for the API slice
  baseQuery: baseQueryWithRefreshToken, // Use the custom base query
  tagTypes: ["Auth", "Service", "Slot"], // Define tag types for caching
  endpoints: () => ({}), // No endpoints defined here; extend this in other files
});
