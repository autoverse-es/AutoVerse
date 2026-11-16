import { Pool } from "@neondatabase/serverless";
let pool: Pool | undefined;
export function db(){if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL missing");return pool??=new Pool({connectionString:process.env.DATABASE_URL});}