import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export class AuthService {
  async register(username: string, email: string, password: string): Promise<any> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({ 
      username, 
      email, 
      password: hashedPassword 
    }).returning();
    return { id: user.id, username, email };
  }

  async login(username: string, password: string): Promise<any> {
    const user = await db.query.users.findFirst({ where: eq(users.username, username) });
    if (!user) throw new Error("User not found");
    
    if (!user.password) throw new Error("Password not set");
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error("Invalid credentials");
    
    return { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      requires2FA: !!user.totpSecret
    };
  }

  async getUserById(id: string): Promise<any> {
    const userId = parseInt(id);
    return db.query.users.findFirst({ where: eq(users.id, userId) });
  }
}

export const authService = new AuthService();
