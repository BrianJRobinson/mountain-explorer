import NextAuth from "next-auth";
import { authOptions } from "../auth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// We need to export config to tell Next.js this is a Route Handler
export const config = {
  runtime: 'edge', // For better performance
}; 