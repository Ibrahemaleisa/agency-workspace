import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { platformAdmins } from "./schema";

/**
 * Creates (or resets the password of) an Operra staff account for the control center.
 *   PLATFORM_ADMIN_PASSWORD='…' npm run platform:admin -- you@operra.com "Your Name"
 * The password is read from the environment so it never lands in shell history as an argument.
 */
async function main() {
  const [email, ...nameParts] = process.argv.slice(2);
  const password = process.env.PLATFORM_ADMIN_PASSWORD ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Usage: npm run platform:admin -- <email> <name>");
  if (password.length < 12) throw new Error("Set PLATFORM_ADMIN_PASSWORD (12+ characters).");
  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(platformAdmins)
    .values({ email: email.toLowerCase(), name: nameParts.join(" ") || email, passwordHash })
    .onConflictDoUpdate({ target: platformAdmins.email, set: { passwordHash, active: true } });
  console.log(`✓ Control center account ready: ${email.toLowerCase()}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
